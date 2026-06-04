# Production Setup

This project is a Vite React app deployed to Vercel with Supabase Auth/Storage and Vercel serverless functions.

## 1. Supabase

1. Create the Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. In **Storage**, verify these buckets exist:
   - `public-assets` — public
   - `protected-datasets` — private
4. Upload the paid dataset to the private bucket:
   - bucket: `protected-datasets`
   - path: `georgia_low_cost_land_opportunities_enriched.csv`
5. Keep only the free sample in the app `public/` folder.

## 2. Local env

Real local values belong in `.env.local`. That file is ignored by git.

For this Vite app, use:

```env
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable__..."
```

Do not use Supabase's Next.js `NEXT_PUBLIC_*` names in this repo unless the app is migrated to Next.js.

## 3. Vercel env

Set these in **Vercel → Project → Settings → Environment Variables**.

Client-safe:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SITE_URL=
VITE_DASHBOARD_STARTER_CHECKOUT_URL=
VITE_DASHBOARD_PRO_CHECKOUT_URL=
VITE_DASHBOARD_INVESTOR_CHECKOUT_URL=
VITE_REPORT_CHECKOUT_URL=
VITE_ANALYTICS_PROVIDER=console
VITE_PLAUSIBLE_DOMAIN=
VITE_POSTHOG_KEY=
```

Server-only:

```env
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
CRON_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL="Georgia Land Finder <hello@georgialandfinder.com>"
```

Never put `SUPABASE_SERVICE_ROLE_KEY`, database passwords, Stripe secrets, webhook secrets, or Resend API keys in `VITE_*` variables.

## 4. Stripe

Create products/payment links and set product metadata:

| Product | Metadata |
| --- | --- |
| Dashboard Starter | `access_level=dashboard_starter` |
| Dashboard Pro | `access_level=dashboard_pro` |
| Dashboard Investor | `access_level=dashboard_investor` |
| Georgia Land Report | `access_level=report_buyer` |

Webhook endpoint:

```text
https://YOUR_DOMAIN/api/stripe-webhook
```

Events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## 5. Verification

Run locally before pushing/deploying:

```bash
npm run typecheck
npm run build
```

Smoke-test after deploy:

1. Visit the landing page and pricing page.
2. Sign up/log in with a test user.
3. Confirm free users only load `free_georgia_land_10_lead_sample.csv`.
4. Promote a test profile to `dashboard_starter` or higher and confirm paid data downloads from Supabase Storage.
5. Confirm direct public access to `/georgia_low_cost_land_opportunities_enriched.csv` returns 404/routing fallback, not the paid CSV.
6. Trigger a Stripe test checkout and verify `profiles.access_level` and `subscriptions` update.
