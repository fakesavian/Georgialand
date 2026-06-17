# Loop Memory — Georgia Low-Cost Land Finder

Rolling, append-only log of what each closed loop changed and verified. Newest at top. Keep entries short; link the fakebot-report for detail. This is the cheaper model's short-term memory across loops — read it before acting.

## Conventions
- One entry per loop. Format below.
- "Verified" means the verification actually ran and passed (paste/point to evidence).
- Never claim a flip to gold without the conversion-report numbers.

---

## Loop A9.1 — Verify Parcel Boundary Map Rendering — 2026-06-18
- **By:** Haiku 4.5.
- **Did:** Investigated why parcel boundaries are not rendering on the map canvas. Root cause: `public/local_dashboard_dataset.csv` has no `Parcel_Boundary_GeoJSON` column — only `Parcel_ID`. All stored-geometry rendering is therefore a no-op in production. The enriched CSV (`data/output/georgia_land_gold_enriched.csv`) DOES have full boundary columns, but production promotion is human-gated. The only boundary that renders in production is the **live county GIS lookup** triggered when a user clicks a pin (`setSelectedBoundaryProperty`), and only for counties with working ArcGIS endpoints. Fixed: (1) updated `dataStatusNote` in `gisLayers.ts` for `parcel-boundaries` layer from misleading "stored geometry exists" language to accurate "click any pin to load on demand — no pre-stored polygons in the current public dataset"; (2) added a cyan canvas hint in `MapView.tsx` when parcel-boundaries is active but no pin is selected, directing users to click a pin. `parseParcelBoundaryGeoJSON(undefined)` returns null safely — no crash risk.
- **Changed:** `src/lib/gisLayers.ts` (dataStatusNote), `src/components/dashboard/MapView.tsx` (canvas hint) | Production CSV untouched: ✓ | No geometry fabricated: ✓ | Tier gating unchanged: ✓
- **Verification:** typecheck ✓ · build ✓ (27.07s) | production CSV clean ✓
- **Result:** Parcel boundary layer is honest: the UI now tells Pro+ users to click a pin; the layer control note explains on-demand loading and absence of pre-stored polygons.
- **Next:** A10 — Auth + Protected Dashboard Production Verification.

---

## Loop B4.1 — Pricing Tier Consistency + Admin Testing Setup — 2026-06-18
- **By:** Sonnet 4.6.
- **Did:** (1) **Export gating**: moved `canExport()` and `canExportLeadCards()` from `PRO_PLUS` → `INVESTOR_PLUS` in `featureGates.ts`. Removed "CSV exports" from Pro features list and added to Investor. Fixed 4 export alert messages in DashboardPage to say "Upgrade to Investor to export data." (2) **Admin account setup**: `access_level = 'admin'` already exists in schema and `UserProfile`. `/admin` route already protected by `ProtectedRoute requireAdmin`. Wrote idempotent `supabase/admin_bootstrap.sql` — run manually in Supabase SQL Editor after `fakesavian@gmail.com` signs up. No code change needed beyond the migration. (3) **Admin tier switcher**: Added `realAccessLevel`, `isAdminTestMode`, `setTestTierOverride` to `AuthContext`. `accessLevel` (used for all gating) = test override if admin + override set, else profile value. `realAccessLevel` = true profile tier (never overridden). Updated `ProtectedRoute` to use `realAccessLevel` for admin-route check so admin testing Free tier can't lock themselves out. Override is session-backed (`sessionStorage`), cleared on sign-out, ignored entirely for non-admin users. Added admin test-mode card to `AdminPage` (tier buttons for Free/Starter/Pro/Investor + reset, labeled "Admin test mode — does not change Stripe billing"). Added amber "Test tier" badge in `Header` with dropdown showing "Real: X / Test: Y".
- **Changed:** `src/lib/featureGates.ts` (export gating), `src/lib/stripePlans.ts` (Pro/Investor feature lists), `src/pages/DashboardPage.tsx` (alert messages), `src/lib/AuthContext.tsx` (effectiveAccessLevel + test mode), `src/components/auth/ProtectedRoute.tsx` (use realAccessLevel for admin check), `src/components/dashboard/Header.tsx` (test-mode badge + dropdown), `src/pages/AdminPage.tsx` (tier switcher card), `supabase/admin_bootstrap.sql` (new, manual action required) | Production CSV untouched: ✓
- **Verification:** typecheck ✓ · build ✓ (26.53s) | production CSV clean ✓ | no secrets touched ✓
- **Result:** Export gating is consistent (code + copy + alerts all say Investor-only). Admin `fakesavian@gmail.com` can test tier gating without fake Stripe subscriptions, and the admin-route guard remains intact during testing.
- **Blocker:** `supabase/admin_bootstrap.sql` must be run manually in Supabase SQL Editor AFTER `fakesavian@gmail.com` has signed up.

---

## Loop B4 — Honest coverage copy pass — 2026-06-18
- **By:** Haiku 4.5.
- **Did:** Audited public-facing and dashboard copy for overstated claims re: data coverage, layer availability, feature status. Found: (1) pricing page promised FEMA flood, zoning overlays as included in Pro; opportunity zones, off-market, land-bank/tax-sale layers as included in Investor — but Loop A9 marked all as `coming_soon` or `partial`, so they render-blocked/disabled. (2) Hero + header + landing page copy claimed "off-market leads" as a live feature. (3) Free sample page claimed access to "parcels, off-market opportunities" (misleading—parcel boundaries are verified-source-only, off-market is coming_soon). (4) FAQ vague on what's live vs being built. **Fixed:** (1) `stripePlans.ts`: Pro now says "FEMA flood and zoning layers (coming soon)" + "Parcel boundaries (where verified-source records exist)"; Investor changed off-market/opp-zone/land-bank/tax-sale to "(coming soon)". (2) `Header.tsx` tagline: removed "off-market". (3) `GeorgiaLandSearchHero.tsx`: removed "off-market" from hero tagline. (4) `LandingPage.tsx`: removed "off-market" from SEO desc and hero; changed "zoning code" filter mention to "county, source type" (honest). (5) `FreeSamplePage.tsx`: updated benefits/copy to say "10 curated listings" not "parcels and off-market"; removed off-market from SEO desc; removed off-market from "Unlock" feature card. (6) `FAQPage.tsx`: clarified GIS answer: "parcel boundaries (where verified-source records exist)"; plan comparison: "advanced layers still being built". (7) `PricingPage.tsx`: Free tier no longer says "no off-market layer" (it's not a feature at all); says "no advanced filters" instead.
- **Changed:** `src/lib/stripePlans.ts` (honest layer status), `src/components/dashboard/Header.tsx` (tagline), `src/components/marketing/GeorgiaLandSearchHero.tsx` (hero desc), `src/pages/LandingPage.tsx` (SEO + hero + zoning mention), `src/pages/FreeSamplePage.tsx` (benefits + copy + feature card), `src/pages/FAQPage.tsx` (GIS answer + plan comparison), `src/pages/PricingPage.tsx` (Free tier features) | Production CSV untouched: ✓
- **Verification:** typecheck ✓ · build ✓ (16.87s) | production CSV clean ✓
- **Result:** Public copy now matches Loop A9 honesty layer work: no claim of off-market, opportunity zones, or FEMA as "live"; no false parcel-boundary universality; tiers accurately describe what's live, partial, or coming soon; upgrade paths are compelling but honest.
- **Next:** none—SECONDARY track complete. PRIMARY (gold dataset) and SECONDARY (product polish + copy) tracks now finished.

---

## Loop A9 — Map layer controls (honest data status) — 2026-06-18
- **By:** Sonnet 4.6.
- **Did:** Inspected map architecture — found it **clear and mature** (no Opus pause): `GIS_LAYER_CONFIGS` + `MapLayerControl` (collapsible, tier-aware, base maps + GIS overlays) + `MapView` (`activeLayerIds`/`handleToggleLayer`, per-layer conditional render, desktop right-panel + `MobileLayerSheet`). Real-rendering layers today: property pins, county/city boundaries (Census), parcel boundaries (verified county GIS / stored GeoJSON). **Honesty gap fixed:** several layers were tier-gated toggles but had NO real data — `fema-flood` drew only a placeholder bounding rectangle mislabeled "FEMA NFHL"; `opportunity-zones`/`land-bank`/`tax-sale` had no render path; `off-market` drew synthetic circles around every pin. Added `dataStatus` (`live`/`partial`/`coming_soon`) + `dataStatusNote` to `GisLayerConfig`; annotated all 10 layers honestly; added `isLayerDataAvailable()` helper. `MapLayerControl` now disables `coming_soon` toggles and shows a "Coming soon" badge + honest reason; `partial` layers (parcel/zoning) show a note. `MapView` defensively excludes `coming_soon` layers from `activeUnlockedLayerIds`, so the misleading FEMA rectangle and off-market circles can no longer render. Tier-lock behavior unchanged; mobile sheet + A7 map/list flow intact.
- **Changed:** `src/types/gis.ts` (dataStatus types), `src/lib/gisLayers.ts` (annotations + `isLayerDataAvailable`), `src/components/dashboard/MapLayerControl.tsx` (coming-soon badge + disabled toggles), `src/components/dashboard/MapView.tsx` (render guard) | Production CSV untouched: ✓
- **Verification:** typecheck ✓ · build ✓ (16.53s) | production CSV clean ✓
- **Result:** Available layers (pins, county/city/parcel) toggle as before; unavailable layers are honestly labeled "Coming soon" and cannot be enabled — no fabricated overlays. Mobile + desktop map controls preserved.
- **Next:** B4 (honest coverage copy pass) — sequence complete.

---

## Loop A8 — Free / Pro / Investor gating — 2026-06-18
- **By:** Sonnet 4.6.
- **Did:** Audited existing tier gating — found it already mature: `src/lib/featureGates.ts` (typed helpers for every tier), `src/lib/gisLayers.ts` (per-layer `minAccessLevel` + `canAccessGisLayer`), and DashboardPage already gates row limit (`getMaxRowsAllowed`, free=10), exports (`canExport`, Pro+), favorites tab (Pro+), agency tab (Investor+). **Source of truth:** `profiles.access_level` from Supabase via `AuthContext`; defaults to `free_preview` for unknown/unauthenticated (conservative, no fake access). Local dev bypass via `VITE_LOCAL_DASHBOARD_BYPASS`+`VITE_LOCAL_ACCESS_LEVEL`. **Added** the two genuine gaps: (1) advanced FilterPanel section (dropdowns/ranges/price/source) now gated behind `canViewFullDatabase` (Starter+) — free tier keeps search + quick toggles, sees an honest "Advanced filters are a paid feature" teaser with Upgrade CTA; threaded `accessLevel` through DashboardPage → FilterPanel + MobileFilterModal. (2) Header tier pill now uses friendly `getTierLabel()` instead of raw enum string. No Stripe/webhook changes; no checkout changes.
- **Changed:** `src/components/dashboard/FilterPanel.tsx` (accessLevel prop + advanced-filter teaser), `src/components/dashboard/MobileFilterModal.tsx` (forward accessLevel), `src/components/dashboard/Header.tsx` (getTierLabel), `src/pages/DashboardPage.tsx` (pass accessLevel to both filter surfaces) | Production CSV untouched: ✓
- **Verification:** typecheck ✓ · build ✓ (16.35s) | production CSV clean ✓ | no secrets touched ✓
- **Result:** Honest gating — free users get a useful but limited dashboard (10 rows, search + quick filters, teaser map layers); paid features are visibly locked with upgrade paths; unknown state never grants paid access.
- **Next:** A9 (map layer controls).

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
