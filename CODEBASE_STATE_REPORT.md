# Georgia Low-Cost Land Finder — Codebase State Report (v2)

> **Audit Date**: 2026-05-31  
> **Auditor**: Antigravity (AI Codebase Auditor)  
> **Status**: Read-only inspection of recent updates

---

## Part 1 — Project Overview (Updated)

| Property | Value |
|---|---|
| **Framework** | React 18 (SPA, client-side rendering) |
| **Routing** | `react-router-dom` v7 with `BrowserRouter` |
| **Auth** | **Supabase Auth** (Google OAuth + Magic Links) implemented |
| **Data Fetching** | CSVs now securely fetched from Supabase Storage buckets via `dataFetcher.ts` |
| **Payments** | Stripe scaffolding added (`CheckoutSuccessPage`, `CheckoutCancelPage`) |
| **Analytics** | **PostHog** & **React Helmet** integrated globally in `App.tsx` |
| **Deployment** | `vercel.json` added for SPA rewrites and caching headers |
| **SEO** | `robots.txt` and `sitemap.xml` generated |

---

## Part 2 — Key Updates Since Last Audit

### ✅ Phase 1: Authentication & Infrastructure (Completed)
- Integrated `@supabase/supabase-js`.
- Configured `AuthContext.tsx` to wrap the app and manage user sessions.
- Added `LoginPage.tsx` and `SignupPage.tsx` supporting Google OAuth and Email Magic Links.
- Added `ProtectedRoute.tsx` to secure `/dashboard`, `/account`, and `/admin` routes.
- Reworked `auth.ts` to use real user `AccessLevel` profiles from Supabase instead of a mock user.

### ✅ Phase 4 & 5: Analytics, SEO & Deployment (Completed)
- Initialized `posthog-js` globally.
- Implemented `AnalyticsTracker` in `App.tsx` for custom pageview tracking.
- Added `<HelmetProvider>` and `SEO.tsx` component for dynamic per-page meta tags.
- Created `robots.txt` and `sitemap.xml` for crawler indexing.
- Created `vercel.json` to handle client-side routing rewrites (`/(.*) -> /index.html`) and caching.

### 🟡 Phase 2: Payments & Data Protection (In Progress)
- Built `dataFetcher.ts` which successfully attempts to route requests for the primary dataset to a secure Supabase `protected-datasets` bucket, based on the user's `AccessLevel`.
- Free users pull the sample CSV from the `public-assets` bucket or the local `public` folder.
- Created `CheckoutSuccessPage.tsx` and `CheckoutCancelPage.tsx` for Stripe redirects.

### 🟡 Phase 3: Alerts & Email (In Progress)
- Created `alertDigest.ts` containing the core logic to parse `AlertPreferences`, match them against properties, and generate a nicely formatted HTML email digest.

---

## Part 3 — Remaining Issues & Blockers

### 🔴 Critical Security Risk
The file `public/georgia_low_cost_land_opportunities_enriched.csv` **still physically exists in the repository**. Even though the app uses `dataFetcher.ts` to request it from Supabase for paid users, the file is still deployed as a static asset. Anyone who knows or guesses the URL (`/georgia_low_cost_land_opportunities_enriched.csv`) can download it without authenticating. 
**Action:** Delete this file from the `public/` folder immediately.

### 🔴 Missing Backend Work (Webhooks & CRON)
The frontend UI is largely complete, but the system still lacks the necessary backend functions to operate:
1. **Stripe Webhooks**: There is no Edge Function or API route to listen for Stripe's `checkout.session.completed` event. Therefore, when a user pays, their Supabase `profiles.access_level` will never update.
2. **Email Delivery**: While `alertDigest.ts` generates the email HTML, there is no scheduled job (e.g., Supabase pg_cron or Vercel Cron) actually executing this script and sending the emails via an ESP like Resend.

### 🟡 Minor Polish
- The Hero component counts (e.g., "112 listings") are still hardcoded.
- The `DashboardPage.tsx` monolith remains extremely large.

---

## Part 4 — Next Steps
The frontend scaffolding is essentially done. You are ready to focus entirely on **Server-Side / Edge Functions** to glue the payments and email delivery together. 

See the updated `NEXT_BUILD_CHECKLIST.md` for the prioritized remaining tasks.
