# Orchestrator Plan — Georgia Low-Cost Land Finder

> **Authored by:** smarter-model setup pass, 2026-06-17.
> **Executed by:** cheaper model in bounded loops. **Do not re-plan the whole project** unless repo state has clearly diverged. Follow this plan; pick one loop at a time from `docs/NEXT_ACTIONS.md`.

---

## 1. Mission

A paid, investor-grade dashboard of **curated, verified** Georgia low-cost land opportunities (land-bank, surplus, tax-sale). The dataset *is* the product. The frontend MVP is largely built; the leverage now is **data quality** (a trustworthy gold dataset) plus targeted product/UX polish — without overstating coverage.

## 2. Current state (snapshot 2026-06-17)

- **Stack:** Vite + React 18 + TS + Tailwind; Supabase (auth/profiles/Storage); Stripe via Vercel `api/**`; Leaflet map; PostHog. Build = `npm run typecheck` + `npm run build`.
- **Frontend:** auth, protected routes, pricing/checkout, dashboard (table/card/map/analytics/data-quality/favorites/agency), red parcel boundaries, admin upload, alert stubs — all present.
- **Active work loop (uncommitted on `main`):** the **gold dataset quality pipeline** under `scripts/` + `scripts/lib/`.
  - Dataset: `public/local_dashboard_dataset.csv` — 358 rows, 133 fields, DeKalb-heavy.
  - Readiness (input): **0 eligible, 42 near-ready, 307 not-ready, 9 quarantined**.
  - Last conversion run (`reports/gold_conversion_summary.json`): of 42 near-ready, **12 flipped to gold**, 14 geometry-verified, **30 still blocked**. Output written to `data/output/georgia_land_gold_enriched.csv` (production CSV untouched — correct).
- **Verified county GIS connectors** (`scripts/lib/parcelGis.mjs`): Fulton, DeKalb, Gwinnett, Floyd, Ware = `verified`; Clarke, Forsyth, Cherokee, Cobb, Clayton = `researched`; Richmond/Bibb/Chatham/Douglas/Henry/Rockdale/Muscogee/Dougherty/Lowndes/Glynn/Fayette = `placeholder` (flagged, never guessed).

## 3. Definition of done — "gold" row (from `scripts/lib/goldReadiness.mjs`)

A row is **eligible** (gold) iff ALL hold:
- `rowType === 'parcel_lead'` (usable Parcel_ID **and** valid GA lat/lon),
- weighted `overall ≥ 80`,
- `boundaryReady` (valid GA polygon GeoJSON, `Parcel_Boundary_Verified=Yes`, confidence ≥ 70),
- `priceScore ≥ 80` (numeric or range price),
- `sourceScore ≥ 67` (≥ 4 of 6 source checks),
- acquisition type **present** (auto-fill only when inference is `auto_confident`).

`Human_Reviewed=Yes` and `Last_Checked_Date` are not hard gates but feed the review/audit dimension → they pull `overall` toward/over 80.

## 4. Guardrails (apply to every loop)

- **Honesty:** never fabricate. Geometry only from official county ArcGIS (exactly-one-polygon-contains-point, or normalized exact parcel-ID match; GA-bounds only). Prices/title/zoning only from cited sources. Unverifiable → flag.
- **Production data:** never auto-overwrite `public/local_dashboard_dataset.csv`. Enriched copies go to `data/output/`. Promotion to production = separate human-reviewed step.
- **Security:** server secrets never in `VITE_*` or `public/`. Protected dataset never in `public/`. Regrid token server-only.
- **Verification:** code → typecheck + build; UI → browser; data → re-run script + report diff + prod CSV unchanged. No evidence = not done.
- **Scope:** one objective per loop; one specialist per loop; never two agents editing the same files in one loop.

## 5. Tracks & priority

1. **PRIMARY — Gold dataset expansion** (data agent led). Highest leverage, fully automatable, honest. Grow eligible rows from 12.
2. **SECONDARY — Product/UX polish** (builder/product-growth). Only when it raises trust or conversion; don't outrun the data.
3. **HUMAN-GATED — MVP production hardening** (verifier scopes; needs live env). Lives in `docs/BLOCKERS.md` until a human supplies access.

## 6. Bounded loop sequence (execute in order; details in NEXT_ACTIONS)

- **Loop 1 — Price normalization for geometry-verified near-ready rows.** Rows already boundary-verified but blocked only by `price_not_numeric` (e.g. GA-005, GA-012). Data agent normalizes price **from the cited source only**; re-run `convert-near-ready-to-gold.mjs`. Expect several flips to gold. *(Closest wins.)*
- **Loop 2 — Fix the Clarke County connector (HTTP 400).** GA-035, GA-042 fail with `GIS query failed for Clarke: HTTP 400`. Data agent repairs the ACC_PARCELS endpoint/field in `scripts/lib/parcelGis.mjs` (mirror the src registry); scout verifies the endpoint first. Unblocks 2 rows + reliability.
- **Loop 3 — Acquisition_Type review pass.** ~300 rows blank. Promote `suggested_needs_review` → present only where the source clearly supports it. Lifts `overall` broadly; moves not-ready → near-ready.
- **Loop 4 — Add the highest-value placeholder county connector (research-gated).** Richmond has the most stuck rows (GA-014/033/045/047/048/054–057). Scout checks for an official Richmond ArcGIS REST endpoint; if verified, data agent adds it; if none exists, leave flagged and log to BLOCKERS (do **not** guess). Coordinate-missing Richmond rows still need lat/lon.
- **Loop 5 — Review-audit completeness for gold candidates.** Set `Last_Checked_Date` / `Verification_Level` for rows the pipeline verified; build the human-review queue for `Human_Reviewed`. Flip the final human bit only with a real spot-check.
- **Loop 6+ — Product polish (as capacity allows):** compute hero counts from real data; decompose `DashboardPage.tsx`; account-backed favorites/notes; honest coverage copy (product-growth).

After Loop 5, re-audit with `scripts/audit-gold-dataset-readiness.mjs`, update this snapshot, and re-prioritize.

## 7. Loop-close checklist (orchestrator)

1. Specialist returns verification evidence → verifier confirms (for non-trivial changes).
2. Append to `docs/LOOP_MEMORY.md`; re-prioritize `docs/NEXT_ACTIONS.md`; add blockers to `docs/BLOCKERS.md`.
3. Write the fakebot-report (`docs/fakebot-reports/<date>_<slug>.md`).
4. Commit the verified loop (project convention) — **only when the user has asked you to commit**; the agent-setup phase commits nothing.

## 8. Agents

Definitions live in `.claude/agents/` (orchestrator, scout, builder, data, verifier, product-growth); roster summary in `docs/AGENTS.md`. The orchestrator dispatches; specialists stay in their lane.
