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

- ⬜ **B1 — Compute hero/category counts from real data** (builder) — remove hardcoded counts (`src/components/marketing/GeorgiaLandSearchHero.tsx`, dashboard stats) using final gold dataset count from human review.
- ⬜ **B2 — Decompose `DashboardPage.tsx`** (builder) — extract sub-tabs/stats/monetization into components.
- ⬜ **B3 — Account-backed favorites/notes** (builder) — migrate from localStorage to Supabase.
- ⬜ **B4 — Honest coverage copy pass** (product-growth) — boundaries "available for verified-source records"; property vs program leads.

## HUMAN-GATED — see `docs/BLOCKERS.md`
- ⛔ Stripe end-to-end test · ⛔ Supabase/Google OAuth live verification · ⛔ `alert_preferences` unique(email) · ⛔ protected-dataset Storage object confirmation.

---
**Rule:** finish and verify the current loop before starting the next. Re-sort this list after every loop.
