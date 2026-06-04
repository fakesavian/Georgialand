# Georgia Low-Cost Land Finder — Next Build Checklist (v2)

> **Progress Update**: Great velocity on the frontend. Infrastructure, Auth, Analytics, and SEO are largely complete. The remaining work is almost entirely focused on backend integrations (Stripe Webhooks and Email).

---

## ~~Phase 1 — Infrastructure & Authentication~~ (✅ DONE)
- ~~Set up Supabase project~~
- ~~Install `@supabase/supabase-js`~~
- ~~Build Auth System (AuthContext, Google OAuth, Magic Links)~~
- ~~Create ProtectedRoute wrapper~~
- ~~Replace `MOCK_USER`~~

## Phase 2 — Payments & Access Control
_Goal: Users can subscribe via Stripe and their access level updates automatically._

- [x] Create `CheckoutSuccessPage` and `CheckoutCancelPage`
- [x] Protect CSV data client-side (`dataFetcher.ts`)
- [ ] 🔴 **Delete the enriched CSV from the `public/` directory** to prevent direct bypassing of the paywall.
- [ ] 🟡 **Create Stripe products and prices** — 3 subscription tiers ($39/$79/$149) + 1 one-time ($29). Update `.env`.
- [ ] 🔴 **Build Stripe webhook handler** (Vercel serverless function or Supabase Edge Function)
  - [ ] Handle `checkout.session.completed` → update Supabase `profiles.access_level`
  - [ ] Handle `customer.subscription.updated` → sync tier changes
  - [ ] Handle `customer.subscription.deleted` → downgrade to `free_preview`

## Phase 3 — Email & Lead Capture
_Goal: Email addresses are captured, stored, and leads can receive alerts._

- [x] Create email digest template generator (`alertDigest.ts`)
- [ ] 🟡 **Build Free Sample form API** (Supabase Edge Function or Vercel Function) to store emails and send the sample.
- [ ] 🟡 **Wire `AlertsPage.tsx`** to properly persist preferences to a Supabase `alert_preferences` table.
- [ ] 🔴 **Build alert email pipeline**
  - [ ] Create a scheduled CRON function (Vercel cron / Supabase pg_cron).
  - [ ] Fetch new properties and user preferences.
  - [ ] Execute `alertDigest.ts` and send emails via Resend/SendGrid.

## ~~Phase 4 — Analytics & Tracking~~ (✅ DONE)
- ~~Install `posthog-js` and initialize in `App.tsx`~~
- ~~Track custom page views~~
- ~~Wire `analytics.ts`~~

## ~~Phase 5 — Deployment & SEO~~ (✅ DONE)
- ~~Create `vercel.json` for SPA rewrites~~
- ~~Create `robots.txt` and `sitemap.xml`~~
- ~~Install `react-helmet-async` for per-page SEO~~
- ~~Create `NotFoundPage.tsx`~~

## Phase 6 — Polish & Maintenance
_Goal: Production stability, performance, and code quality._

- [ ] 🟡 **Decompose `DashboardPage.tsx`** — extract sub-tab logic, stats cards, and the monetization view into separate components.
- [ ] 🟢 **Add table pagination** — virtual scroll or page-based to improve performance with large datasets.
- [ ] 🟢 **Fix hero category counts** — compute counts from actual CSV data instead of using hardcoded numbers.
- [ ] 🟢 **Persist favorites + notes to Supabase** — currently they are still relying on `localStorage`.
- [ ] 🟢 **Add React error boundaries** — wrap dashboard and main app to prevent full app crashes.
