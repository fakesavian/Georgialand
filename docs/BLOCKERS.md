# Blockers — Georgia Low-Cost Land Finder

Things that cannot be completed by the model alone, or that are gated on external/human action. The orchestrator routes around these and revisits when the gate clears. Add new blockers as loops surface them.

> Status key: ⛔ blocked · 🟡 partially mitigated · ✅ cleared (move to LOOP_MEMORY)

---

## Human / live-environment gated (cannot verify from repo)

- ⛔ **Stripe end-to-end checkout → entitlement.** Needs live Vercel env (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL`/`VITE_SITE_URL`, all six `STRIPE_DASHBOARD_*_PRICE_ID`) + one real test checkout confirming `profiles.access_level` upgrades. **Unblock:** human runs the test in the deployed env.
- ⛔ **Supabase Auth + Google OAuth live verification.** Site URL, redirect allow-list, Google Cloud OAuth client, and provider enablement can't be proven from code. Prior incident: Google external-code exchange failure. **Unblock:** human verifies dashboard settings + one real Google login.
- ⛔ **Protected-dataset Storage object.** Confirm `protected-datasets/georgia_low_cost_land_opportunities_enriched.csv` exists with correct RLS. **Unblock:** human checks Supabase Storage.
- ⛔ **Promotion of enriched dataset → production.** Copying `data/output/georgia_land_gold_enriched.csv` over `public/local_dashboard_dataset.csv` (and uploading to Storage) is a deliberate human-reviewed step. The pipeline must never do this automatically.

## External connectivity gated (verified sources but currently unreachable)

- ⛔ **Richmond County ArcGIS endpoint fetch failures.** Service identified (`gismap.augustaga.gov`, Layer 451, PARID field) but runtime fetch fails; may require auth, CORS, or is temporarily unavailable. GA-014/GA-033/GA-045/GA-047/GA-048/GA-054–057 remain blocked. **Unblock:** verify live endpoint availability or find alternative.

## Data-coverage gated (needs a verified external source — never guess)

- ⛔ **Placeholder counties have no official ArcGIS parcel endpoint.** Richmond, Bibb, Chatham, Douglas, Henry, Rockdale, Muscogee, Dougherty, Lowndes, Glynn, Fayette. Boundaries for these rows stay flagged until a verified endpoint is found (scout) or a licensed provider (Regrid) is approved. **Do not fabricate geometry.**
- ⛔ **Clarke County ArcGIS endpoint is broken.** Service ID `uU67H6v3g22H29D3` doesn't exist or is permanently misconfigured (HTTP 400 "Invalid URL"). Scout verified endpoint is unreachable. Downgraded Clarke to placeholder. GA-035 and GA-042 remain blocked until a working ACC parcel REST API is found.
- ⛔ **Rows missing coordinates AND parcel ID** (e.g. several Richmond rows GA-047/048/054–057). No point-in-polygon and no ID match possible → blocked until a usable coordinate or parcel ID is sourced.
- 🟡 **GA-046 (Rome-Floyd Land Bank Lot) pin coordinates may not match parcel I14W 120.** Production pin is lat=34.2545, lon=-85.1612. A9.2 added boundary validation that will flag this as `near_match` or `mismatch` at runtime if the Floyd ArcGIS polygon centroid is farther than 250m from the pin. UI will show amber outline + "Boundary found, but it does not match..." instead of "Verified." **Unblock:** human verifies correct lat/lon for parcel I14W 120 in Rome, GA and corrects the production CSV (requires human-reviewed CSV promotion).
- ⛔ **Regrid / licensed provider decision.** Per `docs/PROVIDER_FIT_DECISION_MATRIX.md`: open a free Regrid trial only for gap counties; answer the 4 licensing questions (derivative works, entry price, export boundary, tile caching) **before** any paid contract. Token stays server-only.

## Feature backend not yet provisioned (code ready, table/apply human-gated)

- ⛔ **Admin account for `fakesavian@gmail.com` requires manual SQL.** `supabase/admin_bootstrap.sql` is ready. Run it in the Supabase SQL Editor AFTER the account signs up (trigger creates the profile row automatically). Without this, the admin test tier switcher and admin routes are inaccessible. **Unblock:** human signs up with `fakesavian@gmail.com`, then runs the bootstrap SQL.
- 🟡 **Account-backed favorites need the `saved_listings` table.** Favorites/notes are device-scoped (localStorage) today via `src/lib/useFavorites.ts`. Live Supabase has only `profiles`, `subscriptions`, `alert_preferences` — no favorites table. Proposed migration written at `supabase/saved_listings_schema.sql` (NOT applied). **Unblock:** human reviews + applies the migration, then `useFavorites.ts` flips `isAccountBacked` and adds the remote read/write path (single seam). Do not apply the migration automatically.

## Known code/DB risks to address before selling the relevant feature

- 🟡 **`alert_preferences` upsert needs `unique(email)`.** `api/save-alert-preferences.ts` upserts `onConflict:'email'` but the schema lacks the unique constraint → add the index or change logic before selling alerts. (builder + Supabase migration; migration apply is human-gated.)
- 🟡 **`@types/react-router-dom` v5 vs `react-router-dom` v7** mismatch — typecheck passes today; future type-conflict risk.
- 🟡 **Repo hygiene:** `georgia_land_opportunities_enriched_BACKUP_20260607.csv` is committed at repo root — review whether a paid/private dataset is exposed. (human decision on git history.)
- 🟡 **No automated test suite** beyond `tsc`/build — smoke tests for auth redirect, data load, checkout gate, map popup are "good to have."

---
When a blocker clears, note it in `docs/LOOP_MEMORY.md` and remove/strike it here.
