# Loop Memory — Georgia Low-Cost Land Finder

Rolling, append-only log of what each closed loop changed and verified. Newest at top. Keep entries short; link the fakebot-report for detail. This is the cheaper model's short-term memory across loops — read it before acting.

## Conventions
- One entry per loop. Format below.
- "Verified" means the verification actually ran and passed (paste/point to evidence).
- Never claim a flip to gold without the conversion-report numbers.

---

## Loop B3 — Account-backed favorites (seam + proposal) — 2026-06-18
- **By:** Sonnet 4.6.
- **Did:** Inspected favorites storage + Supabase. Finding: favorites/notes live in localStorage (`glf_favorites`/`glf_notes`), inline in DashboardPage; live Supabase (`mzrfwrgvjmodiozpllpu`) has only `profiles`/`subscriptions`/`alert_preferences` — **no favorites table**. Per honesty rules, did NOT query a missing table or invent a schema. Instead: (1) extracted all favorites/notes logic into `src/lib/useFavorites.ts` — the single seam where account-backing drops in later; exposes `isAccountBacked` (currently always `false`). (2) Wired DashboardPage to the hook (behavior identical — still localStorage). (3) Added honest "saved on this device only — cross-device sync coming soon" banner to FavoritesView (driven by `isAccountBacked`). (4) Wrote `supabase/saved_listings_schema.sql` as a **proposal** (table + RLS, NOT applied). (5) Logged blocker.
- **Changed:** `src/lib/useFavorites.ts` (new), `src/pages/DashboardPage.tsx` (use hook, removed inline LS helpers/handlers + unused `Favorite` import), `src/components/dashboard/FavoritesView.tsx` (isAccountBacked prop + device notice), `supabase/saved_listings_schema.sql` (new proposal), `docs/BLOCKERS.md` | Production CSV untouched: ✓ | No migration applied: ✓
- **Verification:** typecheck ✓ · build ✓ (18.68s) | production CSV clean ✓ | live Supabase unchanged (read-only list_tables only) ✓
- **Result:** Favorites behavior unchanged for users; code now has a clean account-backing seam + reviewed migration proposal. No fake table assumptions, no crash for any user.
- **Next:** A8 (tier gating) — already started in this sequence.

---

## Loop B2 — Decompose DashboardPage.tsx — 2026-06-18
- **By:** Sonnet 4.6.
- **Did:** Extracted 4 self-contained blocks from DashboardPage.tsx (1109 → 992 lines, −117). New files: `MobileDashboardNav.tsx` (49 lines), `MobileFilterModal.tsx` (33 lines), `DashboardStatsGrid.tsx` (60 lines — exports `DashboardStats` interface), `DashboardMetadataBar.tsx` (44 lines). Cleaned unused imports (`FileText`, `AlertTriangle`, `AlertCircle`, `BarChart3`, `Database`) from DashboardPage. Skipped sub-tabs, view controls, monetization table — too much state coupling for this loop.
- **Changed:** `src/pages/DashboardPage.tsx` (imports updated, 4 blocks replaced with components), 4 new component files | Production CSV untouched: ✓
- **Verification:** typecheck ✓ · build ✓ (22.19s) | production CSV clean ✓
- **Result:** Dashboard file smaller and each extracted piece independently understandable. All A7 mobile fixes intact. No behavior changes.
- **Next:** B3 (account-backed favorites) or B4 (coverage copy pass).

---

## Loop B1 — Compute hero/category counts from real data — 2026-06-17
- **By:** Sonnet 4.6.
- **Did:** Replaced hardcoded counts in `GeorgiaLandSearchHero.tsx` with dynamic computation. Hero now loads `/local_dashboard_dataset.csv` on mount, parses it with PapaParse, and computes category counts (North Georgia, Vacant land, Farmland, Pasture, Wooded, Rural acreage, Infill lots) by matching County and Property_Type fields. Fallback: "See full database" if counts unavailable (honors unauthenticated users on landing page). Zero fabrication — counts reflect actual CSV data or show null state.
- **Changed:** `src/components/marketing/GeorgiaLandSearchHero.tsx` (refactored CATEGORIES constant into dynamic state, added `computeCategories()` function, added `useEffect()` to load CSV and compute counts) | Production CSV untouched: ✓
- **Verification:** typecheck ✓ · build ✓ (25.92s) | production CSV clean ✓
- **Result:** Hero category counts now live. Displays actual dataset categorization (north-ga: 17, vacant: 40, rural: 9, infill: 36, others: 0 from production CSV). Graceful fallback for unauthenticated users.
- **Next:** B2 (decompose DashboardPage) or complete.

---

## Loop A7 — Mobile Dashboard Redesign — 2026-06-17
- **By:** Sonnet 4.6.
- **Did:** Five targeted changes to the List tab (no architectural rewrite). (1) `DashboardPage.tsx`: hid inline `FilterPanel` on mobile (`{!isMobile && ...}`) — mobile already has `MobileFilterModal`. (2) Stats grid: 14 cards on desktop → 4 key cards on mobile (Total Listings, Under $50K, Alert Worthy, Avg Fit Score). (3) Metadata bar: hid Source File, date, stale/verification counts on mobile (`hidden sm:flex` / `hidden sm:inline`) — kept Total Rows always visible. (4) Hid Select All/None on mobile (`{!isMobile && ...}`). (5) Hid view mode toggle on mobile — card view is always active on mobile. `PropertyCard.tsx`: image height `h-28 sm:h-40` (shorter on mobile for scan-ability); pros/cons `hidden sm:grid`; recommended action `hidden sm:block`; URL buttons `hidden sm:flex` (all accessible in detail drawer). `MobileDashboardNotice.tsx`: replaced discouraging desktop-push copy with welcoming "browse, filter, save" copy; CTA changed from "Continue on mobile" to "Start exploring".
- **Changed:** `src/pages/DashboardPage.tsx` (5 edits), `src/components/dashboard/PropertyCard.tsx` (4 edits), `src/components/dashboard/MobileDashboardNotice.tsx` (1 edit) | Production CSV untouched: ✓
- **Verification:** typecheck ✓ · build ✓ (18.60s) | production CSV clean ✓
- **Result:** List tab usable on phone — no raw table as primary experience, filters reachable via floating modal, cards scannable, details in drawer. Desktop experience unchanged.
- **Next:** B1 (hero counts from real data) or B2 (decompose DashboardPage.tsx).

---

## Loop A6.2 — Add Source Fields to Review Report — 2026-06-17
- **By:** Haiku 4.5 (implemented by Sonnet 4.6 per model recommendation).
- **Did:** Inspected enriched CSV headers — found `Source_Agency`, `Source_URL`, `Property_Page_URL` all present for all 16 candidates. Wrote `scripts/build-gold-review-summary.mjs` to enrich the existing JSON by looking up source fields from the enriched CSV by Listing_ID. Ran script — 16/16 rows got `Source_Name` and `Source_URL`. Updated `DataReviewPage.tsx`: added `Source_Name` / `Source_URL` to `ReviewRow` type, replaced static empty-state with live clickable link and `Source_Name` field. Also updated `reports/gold_candidates_human_review_queue.csv` (new `Source_Name`/`Source_URL` columns).
- **Changed:** `scripts/build-gold-review-summary.mjs` (new), `reports/gold_candidates_review_summary.json` (regenerated), `reports/gold_candidates_human_review_queue.csv` (regenerated), `src/pages/DataReviewPage.tsx` (type + drawer source section) | Production CSV untouched: ✓
- **Verification:** typecheck ✓ · build ✓ (20.70s) | source coverage: 16/16 Source_URL, 16/16 Source_Name | production CSV clean ✓
- **Result:** Drawer now shows source agency name and clickable `Source_URL` link. Empty state is retained as fallback. No data fabricated.
- **Next:** A7 (Mobile Dashboard Redesign) or B1 (hero counts from real data).

---

## Loop A6.1 — Harden Dataset Review Dashboard — 2026-06-17
- **By:** Sonnet 4.6.
- **Did:** Three correctness fixes to `DataReviewPage.tsx`: (1) `VerificationBadge` was returning `null` for blocked rows (missing `Verification_Level`) — now shows "GIS Not Verified" badge; added `listing_level` case showing "Listing-Level Only". (2) Renamed page `<h1>` from "Gold Dataset Review" → "Gold Candidate Review Queue" — more accurate since only 4 of 16 are actually gold-ready. (3) Added explicit "Source URL not included in review report" empty state in detail drawer — no source fields in the review summary JSON, no fabrication. Removed redundant "Eligible" badge from card (VerificationBadge covers the signal). No lint script in this project.
- **Changed:** `src/pages/DataReviewPage.tsx` (three edits) | Production CSV untouched: ✓
- **Verification:** typecheck ✓ · build ✓ (19.36s) | production CSV clean ✓
- **Result:** Blocked rows now visibly show "GIS Not Verified" badge; heading is honest; source URL gap is declared not hidden.
- **Next:** B1 — compute hero/category counts from real data; or source URL enrichment in review report (add `Source_URL` to audit script JSON output).

---

## Loop A6 — Verified Dataset Review Dashboard — 2026-06-17
- **By:** Opus 4.8.
- **Did:** Built `src/pages/DataReviewPage.tsx` — admin-only page at `/admin/review` that renders the 16 gold-dataset pipeline candidates across three tabs (Gold Ready / Near-Ready / Blocked). Card grid (mobile-responsive, no raw tables), per-row detail drawer, blocker badges, verification badges, warning banner distinguishing enriched output from production CSV. Added route in `src/App.tsx`, nav link + card in `src/pages/AdminPage.tsx`.
- **Changed:** `src/pages/DataReviewPage.tsx` (new), `src/App.tsx` (new import + route), `src/pages/AdminPage.tsx` (nav link + card) | Production CSV untouched: ✓
- **Verification:** typecheck ✓ · build ✓ (18.54s, zero warnings) | production CSV clean (git status) ✓
- **Report:** `docs/fakebot-reports/2026-06-17_loop-a6-data-review-dashboard.md`
- **Result:** `/admin/review` live; 16 candidates browsable by human reviewer; Note: Source_URL not in review summary JSON — visible in full enriched CSV but not surfaced in this view (optional follow-up).
- **Next:** B1 — compute hero/category counts from real data; or human sign-off pass on Gold tab.

---

## Loop A5.1 — Audit consistency correction — 2026-06-17
- **By:** orchestrator (direct correction, no subagent needed).
- **Did:** identified three problems in A5 output: (1) fakebot report summary paragraph incorrectly said "all 16 have GIS boundaries" — corrected to "12 of 16"; (2) LOOP_MEMORY A5 entry had same incorrect claim — corrected; (3) queue CSV was missing `Verification_Level` column entirely — added it, `automated_gis_verified` for 12 GIS-verified rows, `listing_level` for 4 placeholder rows. Confirmed `Human_Reviewed=Yes` was already in production data (not fabricated by pipeline).
- **Changed:** `docs/fakebot-reports/2026-06-17_loop-a5-gold-candidates-audit.md` (summary + metadata sections), `docs/LOOP_MEMORY.md` (A5 entry), `reports/gold_candidates_human_review_queue.csv` (added Verification_Level column).
- **Verification:** typecheck ✓ · build ✓ | production CSV untouched ✓
- **Result:** All A5 docs now internally consistent; queue CSV has correct Verification_Level per row.
- **Next:** A6 / B1 — SECONDARY track (product polish); PRIMARY track complete pending human approval.

---

## Loop A5 — Review/audit completeness for gold candidates — 2026-06-17
- **By:** data agent.
- **Did:** audited enriched CSV (`data/output/georgia_land_gold_enriched.csv`). Found 16 candidates for review: 4 eligible (GA-003/GA-007/GA-044/GA-046, overall 92–99), 12 near-ready high-readiness (GA-002/GA-012/GA-017/GA-018/GA-022/GA-024/GA-026/GA-029/GA-040/GA-041/GA-042/GA-045, overall 86–93). All 16 have valid GA coordinates. **12 of 16** have verified GIS boundaries (geometry-verified via official county ArcGIS). **4 of 16** (GA-040/GA-041/GA-042/GA-045 — Glynn/Sumter/Clarke/Richmond) are placeholder-county-blocked and lack parcel geometry. Set `Last_Checked_Date=2026-06-17`; `Verification_Level=automated_gis_verified` for the 12 GIS-verified rows; `listing_level` for the 4 placeholder-county rows. Human_Reviewed was already Yes in production data (hand-entered). Assembled human-review queue.
- **Changed:** generated reports only (`reports/gold_candidates_human_review_queue.csv`, `reports/gold_candidates_review_summary.json`). Production CSV untouched.
- **Verification:** typecheck n/a · build n/a | audit: 16 candidates reviewed, 4 eligible + 12 near-ready, all coordinates valid, 12 GIS-verified, 4 placeholder-county-blocked | production CSV clean ✓
- **Report:** audit complete; human-review queue ready.
- **Result:** 16 gold candidates prepared for human spot-check sign-off.
- **Next:** B1 (product polish) or B4 (coverage copy) — PRIMARY track complete pending human approval.

---

## Loop 0 — Agent setup & plan (smarter-model pass) — 2026-06-17
- **By:** setup pass (no implementation).
- **Did:** inspected repo; created six subagents in `.claude/agents/`; wrote `docs/ORCHESTRATOR_PLAN.md`, `docs/NEXT_ACTIONS.md`, `docs/BLOCKERS.md`, this file, and `docs/AGENTS.md`.
- **Repo facts captured:** 358-row dataset; 0 eligible / 42 near-ready / 307 not-ready / 9 quarantined; last conversion flipped **12 → gold**, 30 still blocked; verified GIS counties = Fulton/DeKalb/Gwinnett/Floyd/Ware.
- **Changed source/data?** No. No build run. No commit. Production CSV untouched.
- **Verification:** n/a (docs only).
- **Next:** Loop 1 — price normalization for geometry-verified near-ready rows (see NEXT_ACTIONS).

---

## Loop 4 — Add Richmond County ArcGIS connector — 2026-06-17
- **By:** scout + data agent.
- **Did:** scout found official Richmond County ArcGIS endpoint (`gismap.augustaga.gov`, Layer 451, PARID field, status researched). Data agent wired it into `scripts/lib/parcelGis.mjs`, removed Richmond from PLACEHOLDER_COUNTIES, ran conversion. Richmond rows still fail (fetch errors + data accuracy issue in GA-014). Endpoint documented but not currently accessible.
- **Changed:** `scripts/lib/parcelGis.mjs` (Richmond config added, Clarke also corrected in PLACEHOLDER_COUNTIES).
- **Verification:** typecheck n/a · build n/a | data: script shows 4 flipped to gold (on base CSV; enriched versions in data/output/); Richmond rows blocked by fetch failure | production CSV untouched ✓
- **Report:** Richmond endpoint found but fetch-failing; blocker logged.
- **Result:** Richmond wired as researched; GA-014/GA-033/GA-045/GA-047/GA-048/GA-054–057 remain blocked by connectivity.
- **Next:** Loop 5 — Review enriched gold candidates + prepare for human-review promotion (or wrap if capacity reached).

---

## Loop 3 — Acquisition_Type review and promotion — 2026-06-17
- **By:** data agent.
- **Did:** reviewed 300 blank Acquisition_Type rows; all have `Current_Status="Off-Market"` (clear source evidence). Promoted all 300 to `Acquisition_Type="Off-Market Research"`. Re-ran conversion script; readiness counts unchanged (12 eligible, 42 near-ready, 307 not-ready, 9 quarantined) because the 300 blanks are in placeholder counties lacking GIS boundaries. Removed blocker category; improved quality discipline.
- **Changed:** 300 rows in enriched output CSV; production CSV untouched.
- **Verification:** typecheck n/a · build n/a | data: script showed 0→358 rows with acquisition_type present; 12 still flipped to gold (all from GIS-enabled counties); 30 still blocked | production CSV clean ✓
- **Report:** honest finding: blocker removed but gold gate unchanged (GIS boundary is the real gate).
- **Result:** Addressed ~300-row acquisition_type blocker; quality improved; 12 gold rows unchanged.
- **Next:** A4 — Research Richmond County ArcGIS endpoint.

---

## Loop 2 — Fix Clarke County connector (HTTP 400 → placeholder) — 2026-06-17
- **By:** scout + data agent.
- **Did:** scout verified Clarke ArcGIS endpoint is broken (HTTP 400 "Invalid URL" at service level). Data agent downgraded Clarke from `researched` to `placeholder` in `scripts/lib/parcelGis.mjs` and added to PLACEHOLDER_COUNTIES set. Script now handles Clarke gracefully (no more error noise).
- **Changed:** `scripts/lib/parcelGis.mjs` (status flag + set membership).
- **Verification:** typecheck ✓ · build ✓ | script shows GA-035/GA-042 with "no verified ArcGIS parcel endpoint" instead of HTTP 400 | production CSV untouched ✓
- **Report:** endpoint is definitively broken; documented in BLOCKERS.
- **Result:** Cleaned up error handling; GA-035/GA-042 now properly flagged as placeholder-gated (not service-broken).
- **Next:** A3 — Acquisition_Type review pass (~300 blank rows).

---

## Loop 1 — Price normalization for geometry-verified near-ready rows — 2026-06-17
- **By:** data agent.
- **Did:** investigated GA-005 (DRLBA, DeKalb) and GA-012 (Fulton County sealed-bid). Both have verified boundaries but sources don't publish fixed numeric prices (negotiated / auction-dependent). Per honesty rules, prices NOT fabricated. Production CSV untouched.
- **Changed:** none (sources don't support fill).
- **Verification:** typecheck n/a · build n/a | data: script ran, GA-005 & GA-012 remain near_ready (readiness 89/93); no flips | production CSV clean ✓
- **Report:** findings logged above; no fakebot-report (no source changes).
- **Result:** A1 blocked by source limitations (not a code/logic bug; honest accuracy gate).
- **Next:** A2 — Fix Clarke County connector (HTTP 400).

---

## Entry template (copy for each new loop)
```
## Loop <n> — <objective> — <date>
- By: <specialist>
- Did: <one or two lines>
- Changed: <files / scripts / outputs>  | Production CSV untouched: yes/no
- Verification: typecheck <✓/✗> build <✓/✗> | data: <before→after counts> | ui: <evidence/N-A>
- Report: docs/fakebot-reports/<date>_<slug>.md
- Result: <flipped M to gold / fixed X / blocked by Y>
- Next: <next action>
```
