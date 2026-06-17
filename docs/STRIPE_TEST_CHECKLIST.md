# Stripe Checkout → Access Sync — Manual Production Test Checklist

This flow cannot be fully verified from the repo. Run these steps once in the
deployed Vercel environment (Stripe **test mode** first, then a single live
smoke test). Code reviewed and hardened in Loop A11.

## Required environment variables (names only — never print values)

Set in Vercel project settings for the deployment environment:

| Variable | Used by | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | checkout, billing portal, webhook | Stripe server API key |
| `STRIPE_WEBHOOK_SECRET` | webhook | Verifies Stripe event signatures |
| `STRIPE_DASHBOARD_STARTER_MONTHLY_PRICE_ID` | checkout, webhook | Starter monthly price |
| `STRIPE_DASHBOARD_STARTER_ANNUAL_PRICE_ID` | checkout, webhook | Starter annual price |
| `STRIPE_DASHBOARD_PRO_MONTHLY_PRICE_ID` | checkout, webhook | Pro monthly price |
| `STRIPE_DASHBOARD_PRO_ANNUAL_PRICE_ID` | checkout, webhook | Pro annual price |
| `STRIPE_DASHBOARD_INVESTOR_MONTHLY_PRICE_ID` | checkout, webhook | Investor monthly price |
| `STRIPE_DASHBOARD_INVESTOR_ANNUAL_PRICE_ID` | checkout, webhook | Investor annual price |
| `VITE_SUPABASE_URL` (or `SUPABASE_URL`) | all | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | all | Server-side writes that bypass RLS |
| `SITE_URL` (or `VITE_SITE_URL`) | checkout, billing portal | Redirect base URL |

The Stripe webhook endpoint (`/api/stripe-webhook`) must be registered in the
Stripe Dashboard with events: `checkout.session.completed`,
`customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`. The signing secret from that endpoint is
`STRIPE_WEBHOOK_SECRET`.

## Entitlement model (source of truth)

- The app reads `profiles.access_level` (via `AuthContext`). This is the single
  source of truth for feature gating.
- The webhook writes `profiles.access_level` on active subscriptions and resets
  it to `free_preview` on cancel/past_due **only when the user has no other
  active subscription**.
- The `subscriptions` table is the billing audit trail (one row per Stripe
  subscription), upserted on `stripe_subscription_id`.
- **Admin is never overwritten by billing events** (Loop A11). If
  `profiles.access_level = 'admin'`, the webhook records `stripe_customer_id`
  but leaves `access_level = 'admin'` through subscribe / cancel / downgrade.
- Admin **test tier** (sessionStorage override in `AuthContext`) is purely
  client-side and never touches Stripe or the database.

## Manual test steps

### Pro tier
1. [ ] Sign up / log in as a normal test user (not the admin email).
2. [ ] Go to `/pricing`, click **Get Pro** (monthly).
3. [ ] Complete Stripe test checkout (card `4242 4242 4242 4242`, any future
       expiry, any CVC, any ZIP).
4. [ ] Land on `/checkout-success`.
5. [ ] In Supabase, confirm a `subscriptions` row exists with
       `access_level = dashboard_pro`, `status = active`, correct
       `stripe_subscription_id` + `stripe_customer_id`.
6. [ ] Confirm `profiles.access_level = dashboard_pro` for the user.
7. [ ] Reload `/dashboard`: full database visible, advanced filters unlocked,
       parcel boundaries layer available, alerts available.
8. [ ] Confirm **exports are still locked** (Pro is not Investor).

### Investor tier
9. [ ] Upgrade the same (or a fresh) test user to **Investor** via checkout.
10. [ ] Confirm `profiles.access_level = dashboard_investor`.
11. [ ] Confirm exports, bulk tools, deal pipeline, watchlists unlock.

### Cancel / downgrade path
12. [ ] Open the billing portal (`/account` → manage billing) and cancel.
13. [ ] Confirm the `customer.subscription.deleted` (or `updated` →
        `canceled`) event arrives; `subscriptions.status` updates.
14. [ ] Confirm `profiles.access_level` returns to `free_preview` **only if**
        the user has no other active subscription.
15. [ ] Confirm dashboard re-locks paid features (10-row preview).

### Webhook safety
16. [ ] Send a Stripe test event with a bad signature → expect HTTP 400,
        no DB write, no secret in logs.
17. [ ] Send an event for a customer with no matching profile → expect a
        logged error (HTTP 500) and no partial/incorrect write.

### Admin safety (the Loop A11 fix)
18. [ ] With `fakesavian@gmail.com` promoted to admin via
        `admin_bootstrap.sql`, run a test subscribe **and** cancel on that
        account. Confirm `profiles.access_level` stays `admin` throughout —
        only `stripe_customer_id` should change.
19. [ ] Confirm the admin test tier switcher still works and is independent of
        Stripe (switching to "Free" in test mode does not write to the DB).
