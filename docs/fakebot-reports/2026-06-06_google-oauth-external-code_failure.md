# Fakebot Report: Google OAuth External Code Failure

Date: 2026-06-06
Project: Georgia Land / Freelandfinder
Live site: https://georgialand.vercel.app

## Symptom

User repeatedly sees the app callback page fail with:

```text
Sign-in could not be completed
Unable to exchange external code: 4/0A...
```

## Root Cause Finding

Research and repo inspection indicate this specific error is almost certainly upstream of the React callback page. The `4/0A...` value is a Google OAuth authorization code. Supabase Auth receives that Google code at the Supabase callback URL and fails while exchanging it with Google's token endpoint.

That points to Supabase/Google OAuth provider configuration, most commonly:

- wrong Google Client Secret saved in Supabase
- Google Client ID and Client Secret mismatch
- Google OAuth client not a Web application client
- wrong/missing Authorized Redirect URI in Google Cloud
- Supabase provider not actually saved/enabled after editing
- Google OAuth consent screen in Testing and the user is not an allowed test user

## Required Provider Settings

Google Cloud OAuth Web client:

```text
Client ID:
457110400776-ikv6ifnq7l8409vf3dcoc2app2d3egu7.apps.googleusercontent.com

Authorized redirect URI:
https://mzrfwrgvjmodiozpllpu.supabase.co/auth/v1/callback

Authorized JavaScript origin:
https://georgialand.vercel.app
```

Supabase Auth Provider Google:

- Google provider enabled
- Client ID exactly matches the Google Web client above
- Client Secret is from the same Google Web client
- If the secret was regenerated, paste the new full secret and save provider settings

Supabase Auth URL Configuration:

```text
Site URL:
https://georgialand.vercel.app

Redirect URLs:
https://georgialand.vercel.app/**
https://georgialand.vercel.app/auth/callback
https://georgialand.vercel.app/dashboard
https://georgialand.vercel.app/pricing
http://localhost:5173/**
http://127.0.0.1:5173/**
```

## Code Changes Made

- `src/pages/AuthCallbackPage.tsx`
  - redacts Google auth codes from displayed/logged callback errors
  - maps `Unable to exchange external code` to a user-friendly error
  - logs redacted diagnostics to console for admin debugging
  - adds email sign-up recovery option
  - preserves intended `next` destination when sending the user back to login

- `src/pages/LoginPage.tsx`
  - supports safe `next` query param in addition to `plan`/`billing`

- `src/pages/SignupPage.tsx`
  - supports safe `next` query param in addition to `plan`/`billing`

- `src/lib/AuthContext.tsx`
  - handles and logs initial `getSession()` errors instead of silently ignoring them

## Verification

Commands run:

```text
npm run typecheck
npm run build
```

Both passed.

Local UI smoke test used a fake callback URL and verified the app now shows:

```text
Google sign-in could not be completed. Please try again, or log in with your password. If this keeps happening, the Google/Supabase OAuth settings need to be corrected.
```

The raw `4/0A...` code is no longer displayed to the user.

## Important Limitation

Local testing cannot verify the real Google OAuth provider exchange. Real verification must be performed on:

```text
https://georgialand.vercel.app/login
```

using a real Google account that is allowed by the Google OAuth consent screen.

## Security Note

The Google OAuth Client Secret was pasted into chat earlier. Rotate it after setup/testing if possible, then update Supabase Google provider with the new secret.
