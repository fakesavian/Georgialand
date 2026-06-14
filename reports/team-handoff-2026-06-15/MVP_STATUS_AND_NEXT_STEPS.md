# Georgia Land Finder — Codebase Status and MVP Next Steps

**Date:** 2026-06-15  
**Repo:** `D:/2025/user/Aicode/freelandfinder`  
**Current pushed checkpoint:** `e4bb81e feat: capture GIS dashboard MVP progress` on `main` / `origin/main`

## Executive summary

Georgia Land Finder is past a prototype landing-page stage and is now a working Vite/React SaaS-style dashboard with:

- protected routes,
- Supabase auth/profile/Storage integration,
- Stripe subscription checkout/webhook API routes,
- a CSV-powered property intelligence dashboard,
- pricing tiers and feature gates,
- rich property cards/drawers,
- map/GIS layers and red parcel-boundary overlays,
- admin dataset upload plumbing,
- alert preference and scheduled alert API stubs,
- documentation for data sources, scoring, GIS, and competitor gaps.

The app is close to an MVP that can be shown to beta users, but the MVP should be framed as a **curated Georgia land intelligence dashboard** rather than a fully automated acquisition engine. The remaining work is mostly around production hardening: auth/provider verification, Stripe end-to-end verification, dataset quality, storage/deployment configuration, and a short QA pass across the highest-value user flows.

## Verification status

Before report work began, the current project state was pushed:

```text
e4bb81e feat: capture GIS dashboard MVP progress
```

The project passed local verification before the push:

```text
npm run typecheck
npm run build
```

Relevant scripts in `package.json`:

```json
"dev": "vite",
"typecheck": "tsc --noEmit",
"build": "tsc && vite build",
"preview": "vite preview"
```

## Architecture snapshot

### Frontend stack

Evidence: `package.json`, `src/App.tsx`

- Vite + React 18 + TypeScript.
- React Router v7 routes.
- Tailwind-style utility classes and custom CSS.
- Leaflet / React Leaflet map stack.
- PapaParse for CSV ingestion.
- Recharts for analytics.
- Supabase JS/SSR client for auth and Storage.
- Stripe package used in Vercel serverless API routes.

### Route map

Evidence: `src/App.tsx`

Public routes:

- `/` landing
- `/login`
- `/signup`
- `/auth/callback`
- `/pricing`
- `/docs`
- `/faq`
- `/free-sample` / `/free-tier`
- `/report`
- `/alerts`
- SEO slug route `/:slug`

Protected routes:

- `/dashboard`
- `/account`
- `/admin` with admin access requirement

### Data flow

Evidence: `src/lib/dataFetcher.ts`, `src/pages/DashboardPage.tsx`, `supabase/schema.sql`

- Free users load `free_georgia_land_10_lead_sample.csv` from public assets.
- Paid/admin tiers load `georgia_low_cost_land_opportunities_enriched.csv` from private Supabase Storage bucket `protected-datasets`.
- In development or local bypass, paid data can be loaded from `/local_dashboard_dataset.csv`.
- Dashboard parses CSV rows into the broad `LandProperty` interface.
- Feature gates slice visibility/interaction by `access_level`.

### Auth and entitlement model

Evidence: `src/lib/AuthContext.tsx`, `src/components/auth/ProtectedRoute.tsx`, `supabase/schema.sql`

- Supabase auth session is read through `AuthProvider`.
- `profiles.access_level` drives feature access.
- `handle_new_user()` trigger creates a profile row on signup.
- RLS lets users read their own profile/subscription and admins manage Storage through profile access checks.

### Monetization model

Evidence: `src/lib/stripePlans.ts`, `src/lib/stripeClient.ts`, `api/create-checkout-session.ts`, `api/stripe-webhook.ts`

Paid plans:

- Starter — `dashboard_starter`
- Pro — `dashboard_pro`
- Investor — `dashboard_investor`

Checkout:

- requires signed-in user,
- uses Vercel API route `/api/create-checkout-session`,
- creates/reuses Stripe Customer,
- passes user/plan/billing metadata into Checkout Session and Subscription,
- webhook updates `profiles.access_level` and `subscriptions`.

## Feature status by area

### 1. Landing/pricing funnel — MVP-ready with end-to-end payment verification still needed

Evidence: `src/pages/PricingPage.tsx`, `src/lib/stripePlans.ts`, `src/lib/stripeClient.ts`

Current status:

- Pricing page has free, starter, pro, and investor tiers.
- Monthly/annual toggle exists.
- Unauthenticated paid checkout redirects to signup with plan/billing preserved.
- Authenticated checkout posts to `/api/create-checkout-session`.
- Stripe plan catalog is centralized in `src/lib/stripePlans.ts`.

MVP gaps:

- Need live Vercel env verification for Stripe env vars:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SITE_URL` or `VITE_SITE_URL`
  - all six Stripe Price IDs.
- Need one real Stripe test checkout all the way through webhook entitlement upgrade.
- Need billing portal test for subscription management.

### 2. Auth and protected dashboard — mostly ready, needs provider/dashboard verification

Evidence: `src/pages/LoginPage.tsx`, `src/pages/SignupPage.tsx`, `src/pages/AuthCallbackPage.tsx`, `src/lib/AuthContext.tsx`, `supabase/schema.sql`

Current status:

- Password-first signup/login exists.
- Magic-link backup exists.
- Google OAuth is wired to `/auth/callback?next=...`.
- Callback route safely validates `next` and waits for a session.
- In-app browser warning exists for Facebook/Messenger/Instagram.
- Profile trigger and RLS are defined in schema.

MVP gaps:

- Supabase dashboard settings and Google Cloud OAuth client cannot be proven from repo code alone.
- Existing OAuth incident report indicates prior Google external-code exchange failure; provider settings must be verified live.
- Password reset sends users to `/login`; there is no dedicated password-update page in the inspected code.
- `ProtectedRoute` redirects unauthenticated users to `/login` using router state, but login reads query params; direct protected-route destination preservation is not fully connected.

See `AUTH_SETUP_AUDIT.md` for the separate detailed auth report.

### 3. Dashboard data/product experience — strong beta MVP foundation

Evidence: `src/pages/DashboardPage.tsx`, `src/components/dashboard/PropertyCard.tsx`, `src/components/dashboard/PropertyDrawer.tsx`, `src/types.ts`, `src/utils.ts`

Current status:

- Dashboard loads, parses, filters, sorts, and displays property records.
- Tabs include map/dashboard/analytics/data quality/favorites/agency contacts.
- Property cards include image, source links, price, acreage, zoning/type, fit/risk, pros/cons, recommended next action.
- Property drawer has richer media gallery, field detail sections, source verification, notes/favorite behavior, warnings, and close-up default media behavior.
- Favorites and notes are stored locally.
- Export features exist but are gated by tier.

MVP gaps:

- Favorites/notes are local browser storage, not account-backed persistence.
- No regression tests for CSV schema drift, protected data loading, exports, or feature gates.
- Dataset field naming is broad and flexible, but that makes quality discipline essential.
- Some rows are program-level or source-level rather than parcel-specific; product copy should distinguish “program lead” vs “property lead.”

### 4. Map/GIS experience — strong differentiator, still needs source coverage hardening

Evidence: `src/components/dashboard/MapView.tsx`, `src/components/dashboard/MapLayerControl.tsx`, `src/lib/wareCountyGisConnector.ts`, `src/lib/dataSources/*`, `docs/MAP_LAYER_ARCHITECTURE.md`

Current status:

- Initial map opens to a statewide Georgia view.
- Pin click shows rich popup card rather than forcing the full drawer.
- Pin click can load red verified parcel boundaries when GIS data supports the property.
- Map has base-map options: satellite, topographic, light, dark.
- Map layers are now embedded/dismissible instead of an uncloseable overlay.
- County/city boundary connectors and ArcGIS source registry are being built out.

MVP gaps:

- GIS source coverage is uneven by county.
- Red parcel boundaries should be marketed as “available for verified-source records,” not guaranteed for every row.
- Need one stable QA list of known parcels across Fulton, DeKalb, Ware, Gwinnett, etc., with expected geometry behavior.
- Avoid overpromising zoning/flood/off-market overlays until each source is verified and tier-gated correctly.

### 5. Data source and scoring system — extensive work, needs operational standards

Evidence: `docs/DATA_SOURCE_REGISTRY.md`, `docs/SCORING_MODEL.md`, `docs/OFF_MARKET_DISCOVERY_MODEL.md`, `src/lib/offMarketScoring.ts`, `src/lib/valueScoring.ts`, `data/source_registry.json`, `data/county_gis_source_registry.json`

Current status:

- Data source registry docs exist.
- Scoring model docs exist.
- Off-market scoring/value scoring modules exist.
- GIS connector architecture exists.
- Local dashboard dataset has 358 rows and 133 fields.
- Dataset inspection of `public/local_dashboard_dataset.csv` showed:
  - 358 rows,
  - 133 fields,
  - top county: DeKalb with 306 rows,
  - average data confidence around 90.2,
  - 350 rows with data confidence >= 70.

Important data caveat:

- Acquisition type is blank for ~300 of 358 inspected local rows. The UI can still render them, but data quality for buyer interpretation is not yet consistent.
- Fit/risk score averages suggest many rows may be defaulting to zero or not fully scored; scoring completeness should be audited before paid launch.

See `PROPERTY_CARD_DATA_STANDARD.md` for the separate property-card data checklist.

### 6. Admin and alerting — functional direction, not MVP-critical unless alerts are sold

Evidence: `src/pages/AdminPage.tsx`, `api/save-alert-preferences.ts`, `api/cron/send-alerts.ts`, `src/lib/alertDigest.ts`, `supabase/schema.sql`

Current status:

- Admin page can upload master CSV to private Supabase Storage.
- Alert preference API exists.
- Scheduled alert sender exists and uses Resend when configured.
- Alert digest generator exists.

MVP gaps / risks:

- `api/save-alert-preferences.ts` calls Supabase `.upsert(..., { onConflict: 'email' })`, but the inspected `supabase/schema.sql` does **not** define a unique constraint on `alert_preferences.email`. This can fail in production unless a unique index is added or the upsert logic changes.
- Alert sender currently sends regardless of match quality and has comments acknowledging possible candidate-length logic improvements.
- Email alerts require env verification:
  - `CRON_SECRET`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Known technical risks

### High priority

1. **Provider and env configuration are not fully provable from repo code.**  
   Stripe, Supabase redirect URLs, Google provider settings, Storage objects, Vercel API env vars, and Resend must be verified in dashboards/live environment.

2. **Dataset quality is the product.**  
   The UI is good enough for beta, but paid value depends on high-confidence parcel-level rows, not generic program rows.

3. **Alert preferences upsert likely needs DB constraint.**  
   Add `unique(email)` or change logic before selling alerts.

4. **No automated test suite beyond TypeScript build.**  
   MVP should add a small smoke/regression layer for auth redirects, dashboard data load, pricing checkout gate, and map popup/drawer behavior.

5. **Potential paid/private dataset hygiene.**  
   Protected dataset files are correctly ignored in `.gitignore`, but the pushed checkpoint includes `georgia_land_opportunities_enriched_BACKUP_20260607.csv`. Review whether this backup is safe to keep public in the repo.

### Medium priority

1. `@types/react-router-dom` v5 is installed while `react-router-dom` is v7. Typecheck currently passes, but this is a future type-conflict risk.
2. Favorites and notes are local-only; serious users may expect account persistence.
3. Admin dataset upload has no schema validation before replacing the master CSV.
4. Some docs/reports are duplicated under `docs/` and `reports/`; the new folder helps, but long-term documentation structure should be cleaned.
5. Source registry/connectors are growing and need a clear “verified vs researched vs placeholder” UI/ops status.

## Recommended MVP definition

A realistic MVP target:

> “A password/Google-authenticated Georgia land intelligence dashboard with a curated paid dataset, property cards, map/GIS context, searchable filters, source links, data confidence, and Stripe-gated access.”

Do **not** define the first MVP as:

- full statewide automated source ingestion,
- guaranteed parcel boundaries for every property,
- fully automated MLS/tax/land-bank synchronization,
- polished CRM/pipeline replacement,
- comprehensive email alert product.

## Recommended next steps toward MVP

### Phase 1 — Production access and payment hardening

1. Verify Supabase Auth URL Configuration:
   - Site URL,
   - production redirect URLs,
   - local redirect URLs if needed.
2. Verify Google Cloud OAuth web client and Supabase Google provider.
3. Run one real password signup/login test.
4. Run one real Google login test.
5. Run one Stripe test checkout and confirm `profiles.access_level` upgrades.
6. Confirm private Storage object exists exactly at:
   - bucket: `protected-datasets`
   - object: `georgia_low_cost_land_opportunities_enriched.csv`
7. Confirm free sample object exists publicly or is bundled in `public/`.

### Phase 2 — Data QA pass before beta

1. Adopt the checklist in `PROPERTY_CARD_DATA_STANDARD.md`.
2. Split records into:
   - property-level leads,
   - program/source-level leads,
   - research placeholders.
3. For beta, publish a curated subset of the strongest rows first.
4. Fix blank `Acquisition_Type` rows or explicitly map them from source/category fields.
5. Add a “data completeness score” report that flags missing parcel ID, coordinates, source URL, GIS URL, acquisition process, price, fit/risk/data confidence, and last checked date.
6. Review whether any paid/private dataset backup files should be removed from Git history/public repo.

### Phase 3 — Core dashboard QA

1. Browser smoke test:
   - signup,
   - login,
   - dashboard load,
   - filter/search,
   - property card open,
   - property drawer close-up image,
   - map pin popup,
   - red parcel boundary on known verified parcel,
   - export gate by tier.
2. Add a small Playwright/Puppeteer smoke script for dashboard and pricing flows.
3. Add one CSV schema validation script for required fields.
4. Test mobile and in-app browser signup/login.

### Phase 4 — Alerts/admin only if included in MVP

1. Add unique constraint/index for alert preference email or change upsert logic.
2. Verify Resend domain/from email.
3. Add unsubscribe/consent language if alerts are user-facing.
4. Add admin-side CSV schema validation before upload.
5. Add audit log for dataset replacement.

## MVP launch checklist

### Must pass before beta users

- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Production login works with email/password.
- [ ] Production Google auth works or is hidden until fixed.
- [ ] Signup creates a `profiles` row.
- [ ] Stripe test checkout upgrades `profiles.access_level`.
- [ ] Paid user can download/load protected dashboard dataset.
- [ ] Free user sees only free sample row cap.
- [ ] One known GIS parcel shows red boundary.
- [ ] Property drawer opens close-up by default.
- [ ] Dataset has a documented standard and at least one curated beta set.
- [ ] Private/protected datasets are not unintentionally public.

### Good to have after MVP

- [ ] Account-backed favorites/notes.
- [ ] Saved searches.
- [ ] Automated source refresh monitoring.
- [ ] Alert emails.
- [ ] Admin source verification dashboard.
- [ ] More county GIS coverage.
- [ ] Unit/e2e test suite.

## Bottom-line recommendation

Proceed toward MVP with a **limited beta** after validating auth, Stripe, and protected Storage live. The frontend/product surface is strong enough to demo. The highest leverage work is now operational: verify production configuration, curate a smaller high-confidence dataset, standardize data collection, and avoid selling features whose data sources are not yet verified.
