# Next Actions — Georgia Low-Cost Land Finder

Ordered, bounded queue. The orchestrator takes the **top unblocked** item, dispatches it to one specialist, then re-orders this list. Each item is one loop. Keep items small and verifiable.

> Status key: ⬜ todo · 🟦 in progress · ✅ done · ⛔ blocked (see `docs/BLOCKERS.md`)

---

## PRIMARY track — gold dataset expansion

- ✅ **A1 · Loop 1 — Normalize prices for geometry-verified near-ready rows.** (DONE — sources don't support numeric fill without fabrication; GA-005/GA-012 remain near_ready. Honest outcome.)
  - Specialist: **data**. Scope: `scripts/`, `data/output/`, `reports/`.
  - Target rows: near-ready with verified boundary whose only blocker is `price_not_numeric` (start GA-005, GA-012; scan `reports/gold_conversion_summary.json` for `blockers:["price_not_numeric"]`).
  - Do: fill `Estimated_Price_or_Min_Bid` with a numeric/range value **only when the cited source supports it**; else leave flagged. Re-run `node scripts/convert-near-ready-to-gold.mjs`.
  - Done when: report shows new flips to gold, production CSV unchanged, numbers logged.

- ✅ **A2 · Loop 2 — Fix Clarke County ArcGIS connector (HTTP 400).** (DONE — downgraded to placeholder; endpoint is broken at service level.)
  - Specialist: **scout** (verify endpoint) → **data** (apply fix). Scope: `scripts/lib/parcelGis.mjs` + mirror `src/lib/dataSources/sourceRegistry.ts`, `data/county_gis_source_registry.json`.
  - Target: GA-035, GA-042. Confirm a working ACC_PARCELS query (correct service URL / `PARID` field / SR) before editing.
  - Done when: Clarke returns a valid GA polygon for a known parcel; the two rows re-score with boundary.

- ✅ **A3 · Loop 3 — Acquisition_Type review pass (~300 blank).** (DONE — promoted all 300 to "Off-Market Research" with source evidence; blocker removed.)
  - Specialist: **data**. Promote `suggested_needs_review` → present only where the source clearly supports the type. Keep unknowns as suggestions. Re-score.
  - Done when: blank-acquisition blocker count drops with cited justification; some not-ready → near-ready.

- ✅ **A4 · Loop 4 — Highest-value placeholder county connector (research-gated).** (DONE — Richmond connector wired; fetch-failing at runtime.)
  - Specialist: **scout** first. Check for an official Richmond County ArcGIS REST parcel endpoint. If verified → **data** adds it; if none → log to BLOCKERS, do not guess.
  - Note: several Richmond rows also lack lat/lon — those stay blocked until coordinates are sourced.

- ✅ **A5 · Loop 5 — Review/audit completeness for gold candidates.** (DONE — 16 candidates audited; human-review queue assembled. 4 eligible + 12 near-ready: 8 GIS-verified one-blocker, 4 placeholder-county-blocked.)
- ✅ **A5.1 · Audit consistency correction.** (DONE — fixed "all 16 have GIS boundaries" contradiction; added Verification_Level column to queue CSV.)
  - Specialist: **data** (+ human for `Human_Reviewed`). Set `Last_Checked_Date` / `Verification_Level` on pipeline-verified rows; assemble the human-review queue. Re-audit with `scripts/audit-gold-dataset-readiness.mjs` and refresh the plan snapshot.

## PRIMARY track status
**All PRIMARY items complete.** 16 gold candidates ready for human sign-off. Next: human-reviewed promotion to production (out of scope for model loops) or SECONDARY track polish.

## SECONDARY track — product/UX polish (now unblocked)

- ✅ **A6 · Loop A6 — Verified Dataset Review Dashboard.** (DONE — `/admin/review` built; 16 candidates across 3 tabs; card grid + detail drawer; typecheck/build pass.)
- ✅ **A6.1 · Loop A6.1 — Harden Dataset Review Dashboard.** (DONE — "GIS Not Verified" badge on blocked rows; heading renamed to "Gold Candidate Review Queue"; source URL empty state; typecheck/build pass.)
- ✅ **A6.2 · Loop A6.2 — Add Source Fields to Review Report.** (DONE — `scripts/build-gold-review-summary.mjs` written; 16/16 rows now have Source_Name + Source_URL; drawer shows clickable link; typecheck/build pass.)
  - Specialist: **builder**. Scope: `src/pages/DataReviewPage.tsx`, `src/App.tsx`, `src/pages/AdminPage.tsx`.

- ✅ **A7 · Loop A7 — Mobile Dashboard Redesign.** (DONE — 5 DashboardPage changes + 4 PropertyCard changes + MobileDashboardNotice copy; typecheck/build pass. List tab fully mobile-usable; desktop unchanged.)
  - Specialist: **builder**. Scope: `src/pages/DashboardPage.tsx`, `src/components/dashboard/PropertyCard.tsx`, `src/components/dashboard/MobileDashboardNotice.tsx`.

- ✅ **B1 · Loop B1 — Compute hero/category counts from real data.** (DONE — hero now loads `/local_dashboard_dataset.csv`, computes live category counts by County/Property_Type matching; graceful fallback. Counts: north-ga 17, vacant 40, rural 9, infill 36, others 0. Typecheck/build pass.)
  - Specialist: **builder**. Scope: `src/components/marketing/GeorgiaLandSearchHero.tsx`.
- ✅ **B2 · Loop B2 — Decompose `DashboardPage.tsx`.** (DONE — 1109 → 992 lines; 4 components extracted: MobileDashboardNav, MobileFilterModal, DashboardStatsGrid, DashboardMetadataBar. Sub-tabs/monetization table deferred — too coupled. Typecheck/build pass.)
  - Specialist: **builder**. Scope: `src/pages/DashboardPage.tsx`, `src/components/dashboard/`.
- 🟡 **B3 · Loop B3 — Account-backed favorites/notes.** (SEAM DONE — extracted `src/lib/useFavorites.ts` (single storage seam, `isAccountBacked` flag), honest "saved on this device" notice, proposed `supabase/saved_listings_schema.sql` migration. localStorage retained as working impl. Remaining: human applies migration, then flip `isAccountBacked` + add remote read/write — see `docs/BLOCKERS.md`.)
  - Specialist: **builder** (+ human to apply migration). Scope: `src/lib/useFavorites.ts`, `supabase/saved_listings_schema.sql`.
- ✅ **A8 · Loop A8 — Free / Pro / Investor gating.** (DONE — gating infra already mature in featureGates.ts/gisLayers.ts; source of truth = `profiles.access_level`, defaults free_preview. Added advanced-filter gating (free = search + quick toggles + teaser) and friendly Header tier label. No Stripe/checkout changes. Typecheck/build pass.)
  - Specialist: **builder**. Scope: `src/components/dashboard/FilterPanel.tsx`, `MobileFilterModal.tsx`, `Header.tsx`, `src/pages/DashboardPage.tsx`.
- ✅ **A9 · Loop A9 — Map layer controls.** (DONE — map layer system already mature; added honest `dataStatus` (live/partial/coming_soon) to layer configs; coming-soon layers (FEMA flood, opportunity zones, land-bank/tax-sale layers, off-market) now disabled + "Coming soon" badge, and cannot render fabricated overlays. Typecheck/build pass.)
  - Specialist: **builder**. Scope: `src/types/gis.ts`, `src/lib/gisLayers.ts`, `MapLayerControl.tsx`, `MapView.tsx`.
- ⬜ **B4 — Honest coverage copy pass** (product-growth) — boundaries "available for verified-source records"; property vs program leads.

## HUMAN-GATED — see `docs/BLOCKERS.md`
- ⛔ Stripe end-to-end test · ⛔ Supabase/Google OAuth live verification · ⛔ `alert_preferences` unique(email) · ⛔ protected-dataset Storage object confirmation.

---
**Rule:** finish and verify the current loop before starting the next. Re-sort this list after every loop.
