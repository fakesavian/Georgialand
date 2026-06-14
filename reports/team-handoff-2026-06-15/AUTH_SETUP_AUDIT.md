# Georgia Land Finder — Email and Google Auth Setup Audit

**Date:** 2026-06-15  
**Repo checkpoint reviewed:** `e4bb81e feat: capture GIS dashboard MVP progress`  
**Scope:** Email/password auth, magic-link backup, Google OAuth, callback routing, Supabase profile/RLS/storage setup, and production verification steps.

## Executive summary

The frontend auth implementation is mostly well-structured for MVP:

- password-first signup/login is implemented,
- magic links are positioned as a backup login method,
- Google OAuth is wired from both login and signup,
- redirects use a dedicated public `/auth/callback` route,
- callback route validates `next` destinations,
- Supabase profiles and access-level RLS are defined in SQL,
- protected dashboard/admin routes are gated.

However, repo inspection cannot prove the Supabase dashboard and Google Cloud provider settings are correct. There is also a prior OAuth failure report showing Google external-code exchange errors, so live provider verification is still required before MVP launch.

## Files reviewed

- `src/lib/supabase.ts`
- `src/lib/AuthContext.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/SignupPage.tsx`
- `src/pages/AuthCallbackPage.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/App.tsx`
- `src/lib/dataFetcher.ts`
- `supabase/schema.sql`
- `docs/fakebot-reports/2026-06-06_google-oauth-external-code_failure.md`

## Environment variables expected by auth/data code

Evidence: `src/lib/supabase.ts`, `src/lib/dataFetcher.ts`, API routes.

Required browser-side Supabase vars:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Server/API routes also need:

```text
SUPABASE_SERVICE_ROLE_KEY
```

Recommended site URL vars for API redirects/checkouts:

```text
SITE_URL
VITE_SITE_URL
```

Development/local bypass vars present in code:

```text
VITE_LOCAL_DASHBOARD_BYPASS
VITE_LOCAL_ACCESS_LEVEL
```

## Current implementation assessment

### 1. Supabase client setup

Evidence: `src/lib/supabase.ts`

The app creates a browser Supabase client with:

```ts
createBrowserClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)
```

It throws immediately if either env var is missing. This is good because production misconfiguration fails loudly instead of silently rendering broken auth.

Status: **Good for MVP**, assuming env vars are set correctly in Vercel/local.

### 2. Password signup

Evidence: `src/pages/SignupPage.tsx`

Current behavior:

- email/password form,
- password confirmation,
- minimum password length 8,
- `supabase.auth.signUp({ email, password, options: { emailRedirectTo } })`,
- if Supabase returns a session immediately, user navigates to intended destination,
- otherwise user sees confirmation-email message.

Redirect target:

```text
/auth/callback?next=<encoded destination>
```

Status: **Good for MVP**.

Recommended live checks:

- Confirm Supabase Email provider is enabled.
- Confirm email confirmations are configured intentionally:
  - if confirmation ON: verify email confirmation flow reaches `/auth/callback` then dashboard/pricing destination,
  - if confirmation OFF for beta: verify immediate `data.session` navigation works.

### 3. Password login

Evidence: `src/pages/LoginPage.tsx`

Current behavior:

- email/password form,
- `supabase.auth.signInWithPassword({ email, password })`,
- redirects to `next`, plan/billing checkout resume destination, or `/dashboard`,
- user-friendly errors for invalid credentials, unconfirmed email, rate limits, and network/in-app browser load failures.

Status: **Good for MVP**.

### 4. Magic-link backup login

Evidence: `src/pages/LoginPage.tsx`

Current behavior:

- magic link is not the primary login path,
- user must enter email,
- `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })`,
- success copy says backup login link sent and recommends password for normal logins.

Status: **Good for MVP**.

Why this is good:

- It avoids making magic links the default, which reduces normal-user rate-limit issues.
- It still gives a fallback if password login fails.

### 5. Password reset

Evidence: `src/pages/LoginPage.tsx`

Current behavior:

```ts
supabase.auth.resetPasswordForEmail(email.trim(), {
  redirectTo: `${window.location.origin}/login`,
});
```

Status: **Partially implemented / needs improvement before production polish**.

Issue:

- The app sends recovery links to `/login`, but there is no inspected dedicated password update page or handler for Supabase password recovery events.
- A full Supabase password reset flow usually needs a route where the user can set the new password after the recovery session is established.

Recommendation:

- Add `/update-password` or extend `/auth/callback?next=/account` to detect recovery sessions and show a password update form using `supabase.auth.updateUser({ password })`.
- Configure reset redirect URL in Supabase allow-list.

MVP severity:

- Medium. Login/signup can work without it, but password reset is expected for paid users.

### 6. Google OAuth login/signup

Evidence: `src/pages/LoginPage.tsx`, `src/pages/SignupPage.tsx`

Current behavior:

- Login and signup both call:

```ts
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: buildRedirectUrl() },
});
```

- Redirect URL is:

```text
${origin}/auth/callback?next=<encoded destination>
```

- In-app browser warning is shown for Facebook/Messenger/Instagram/TikTok-like browser user agents.

Status: **Frontend is good; provider settings require live verification**.

Important prior finding:

`docs/fakebot-reports/2026-06-06_google-oauth-external-code_failure.md` documented the error:

```text
Unable to exchange external code: 4/0A...
```

That report correctly identifies this as likely upstream provider configuration, not a React callback bug. Likely causes:

- wrong Google Client Secret in Supabase,
- Google Client ID/secret mismatch,
- OAuth client not Web application type,
- missing Google Authorized Redirect URI,
- Supabase provider not enabled/saved,
- OAuth consent screen in Testing and user not added as test user.

### 7. Auth callback route

Evidence: `src/App.tsx`, `src/pages/AuthCallbackPage.tsx`

Current behavior:

- `/auth/callback` is public, not protected.
- It validates `next` paths and rejects non-relative or `//` URLs.
- It handles `error` and `error_description` query params.
- It redacts Google auth codes from logs/display.
- It waits for `supabase.auth.getSession()` and auth-state changes.
- It intentionally does **not** call `exchangeCodeForSession()` because earlier code/comment notes that `createBrowserClient` handles browser code detection and double exchange can fail with “Unable to exchange external code.”

Status: **Good for current Supabase SSR browser-client approach**, but should be verified live.

Note:

Some Supabase SPA examples explicitly call `exchangeCodeForSession(code)`. This app intentionally avoids that due a prior double-exchange failure. Given the historical context in the repo, this is acceptable as long as live OAuth/email callback tests pass.

### 8. Protected routes

Evidence: `src/components/auth/ProtectedRoute.tsx`, `src/App.tsx`

Current behavior:

- `/dashboard` and `/account` require a logged-in user unless local bypass is enabled.
- `/admin` additionally requires `accessLevel === 'admin'` unless local bypass is enabled.
- Loading state prevents immediate bounce during session initialization.

Status: **Good enough for MVP**.

Small issue:

- `ProtectedRoute` redirects unauthenticated users to `/login` with router state, but `LoginPage` only reads query params (`next`, `plan`, `billing`), not router state. Directly visiting a protected page generally lands at dashboard after login anyway, but preserving arbitrary protected destination is incomplete.

Recommendation:

- Change unauthenticated redirect to `/login?next=${encodeURIComponent(location.pathname + location.search)}` or update `LoginPage` to read `location.state.from`.

### 9. Profile, access level, and RLS setup

Evidence: `supabase/schema.sql`, `src/lib/AuthContext.tsx`, `src/lib/featureGates.ts`

Current schema includes:

- `public.access_level` enum,
- `public.profiles`,
- `public.subscriptions`,
- `public.alert_preferences`,
- `handle_new_user()` trigger on `auth.users`,
- RLS enabled for profiles/subscriptions/alert preferences,
- profile read policy for own row,
- no self-update policy for profile entitlement fields,
- protected Storage read policy based on paid/admin access levels.

Status: **Good core setup for MVP**.

Required live verification:

- After signup, confirm profile row is created.
- Confirm `access_level` starts as `free_preview`.
- Confirm Stripe webhook can update access level using service role.
- Confirm paid dashboard can read `protected-datasets` object.

### 10. Storage access for dashboard data

Evidence: `src/lib/dataFetcher.ts`, `supabase/schema.sql`

Current behavior:

- Free users load `free_georgia_land_10_lead_sample.csv` from public folder or `public-assets` bucket.
- Paid users load `georgia_low_cost_land_opportunities_enriched.csv` from private `protected-datasets` bucket.
- Schema has public read policy for `public-assets` and paid-tier read policy for `protected-datasets`.

Status: **Good architecture; needs live bucket/object verification**.

Required exact object path:

```text
bucket: protected-datasets
object: georgia_low_cost_land_opportunities_enriched.csv
```

## Supabase dashboard settings required

These cannot be verified from repo code, but they must be set.

### Authentication → URL Configuration

Recommended production values:

```text
Site URL:
https://georgialand.vercel.app
```

Redirect URLs:

```text
https://georgialand.vercel.app/**
https://georgialand.vercel.app/auth/callback
https://georgialand.vercel.app/dashboard
https://georgialand.vercel.app/pricing
http://localhost:5173/**
http://127.0.0.1:5173/**
http://localhost:5174/**
http://127.0.0.1:5174/**
```

Add any custom domain too if used:

```text
https://georgialandfinder.com/**
https://georgialandfinder.com/auth/callback
```

### Authentication → Providers → Email

Required:

- Email provider enabled.
- Decide whether email confirmation is ON or OFF for beta.
- If ON, confirmation URLs must allow `/auth/callback`.
- Configure SMTP before broader production if Supabase rate limits become a problem.

### Authentication → Providers → Google

Required:

- Google provider enabled.
- Client ID and Client Secret from the same Google Cloud OAuth **Web application** client.
- Authorized redirect URI in Google Cloud:

```text
https://<your-project-ref>.supabase.co/auth/v1/callback
```

Historical project value from prior report:

```text
https://mzrfwrgvjmodiozpllpu.supabase.co/auth/v1/callback
```

- Authorized JavaScript origin:

```text
https://georgialand.vercel.app
```

Add custom domain if used.

### Google OAuth consent screen

Required:

- If app is in Testing, add test users.
- If app is Production, verify domain and consent screen.
- Scopes should be minimal: email/profile/openid.

## Issues and recommended fixes

### High priority before MVP

1. **Verify Google OAuth live.**  
   The code is wired correctly, but prior provider-level failure means dashboard settings must be checked.

2. **Rotate Google OAuth secret if it was exposed.**  
   Prior report says a Google OAuth Client Secret was pasted into chat. Rotate in Google Cloud and update Supabase.

3. **Verify password signup creates profile row.**  
   This proves `handle_new_user()` trigger and RLS are installed.

4. **Verify paid Storage access.**  
   Manually set a test user to `dashboard_starter` and confirm protected dataset loads.

5. **Complete password reset UX.**  
   Add a proper update-password route/form or callback handling.

### Medium priority

1. Preserve protected route destination through query string instead of router state only.
2. Add auth smoke tests for `/login`, `/signup`, `/auth/callback`, `/dashboard` gating.
3. Add a visible diagnostic/admin check that shows current user email/access level and data bucket loaded.
4. Confirm local bypass vars are disabled in production.

### Related non-auth schema issue

`api/save-alert-preferences.ts` uses:

```ts
.upsert(..., { onConflict: 'email' })
```

But inspected `supabase/schema.sql` does not define a unique constraint on `alert_preferences.email`. Add one before using alert preferences in production:

```sql
create unique index if not exists alert_preferences_email_unique
on public.alert_preferences (email);
```

or change the API to update by authenticated user/profile.

## MVP auth verification checklist

Run these before inviting beta users.

### Local/dev

- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] `/auth/callback?next=%2Fdashboard` renders callback page, not a protected-route bounce.
- [ ] Missing Supabase env vars fail loudly in dev.

### Supabase database

- [ ] `supabase/schema.sql` has been run in the production Supabase project.
- [ ] `public.profiles` exists.
- [ ] `public.subscriptions` exists.
- [ ] `public.alert_preferences` exists.
- [ ] `handle_new_user()` trigger exists on `auth.users`.
- [ ] RLS policies exist for profiles/subscriptions/storage.

### Email/password

- [ ] New password signup succeeds.
- [ ] Profile row is created with `free_preview`.
- [ ] Confirmation email redirects to `/auth/callback` if confirmations are ON.
- [ ] Password login succeeds.
- [ ] Invalid password shows friendly error.
- [ ] Password reset creates a usable recovery flow.

### Magic-link backup

- [ ] Backup login link sends.
- [ ] Link returns to `/auth/callback`.
- [ ] Session is established and user reaches intended destination.
- [ ] Rate-limit copy is acceptable.

### Google OAuth

- [ ] Google button opens Supabase/Google authorize flow.
- [ ] Supabase provider is enabled.
- [ ] Google Client ID/Secret match the same Web OAuth client.
- [ ] Google authorized redirect URI is exactly Supabase callback URL.
- [ ] Test user is allowed if consent screen is in Testing.
- [ ] User returns to `/auth/callback`.
- [ ] User reaches `/dashboard` or preserved pricing checkout destination.
- [ ] No `Unable to exchange external code` error.

### Entitlement / protected data

- [ ] Manually upgrade test profile to `dashboard_starter`.
- [ ] Paid dashboard loads `protected-datasets/georgia_low_cost_land_opportunities_enriched.csv`.
- [ ] Free preview account only sees the free sample / row cap.
- [ ] Stripe test checkout upgrades access level through webhook.

## Bottom-line auth assessment

The codebase is **MVP-close for auth**. Email/password login and signup are implemented in the right direction. Google OAuth is wired correctly from the frontend perspective, but **must be verified in Supabase + Google Cloud dashboards** because prior evidence points to provider-level misconfiguration. The main code improvement before paid launch is a real password reset/update flow.
