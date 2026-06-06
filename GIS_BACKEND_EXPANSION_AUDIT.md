# GIS Backend Expansion Audit

## Repo state at start
- Project: Georgia Low-Cost Land Finder / Georgia Land Finder
- Path: `D:/2025/user/Aicode/freelandfinder`
- Auditor observed commit: `245d611 harden OAuth callback diagnostics`
- Dirty item before FAKEbot changes: untracked `fix this later.PNG` only. It was not touched.

## Current map implementation
- `src/pages/DashboardPage.tsx` lazy-loads `src/components/dashboard/MapView.tsx` for map view.
- `MapView.tsx` uses React-Leaflet/Leaflet, point markers, popups, and four base layers: CARTO dark, CARTO voyager, Esri imagery, OpenTopoMap.
- Data plotted is limited to CSV rows with valid `Latitude` and `Longitude`.
- Fit score controls marker color; popups show address, location, fit/risk, price, and detail CTA.
- Missing before this expansion: parcel polygons, ArcGIS REST/GeoJSON overlays, layer gating, per-layer status, zoning/flood/opportunity overlays.
- Found current map bug: escaped template literals in badge classes/card IDs could break marker-to-card linking and styling.

## Current data loading
- `src/lib/dataFetcher.ts` is the dashboard data gateway.
- Free/non-paid users load `/free_georgia_land_10_lead_sample.csv`, with Supabase `public-assets` fallback.
- Paid dashboard users load `georgia_low_cost_land_opportunities_enriched.csv` from private Supabase Storage bucket `protected-datasets`.
- `DashboardPage.tsx` parses CSV client-side with PapaParse, then filters/sorts/stats in browser.
- There is no normalized property database table or backend query API yet.

## Current CSV/protected dataset flow
- `src/types.ts` defines broad `LandProperty` fields for the enriched CSV contract.
- Full/protected CSV files must remain out of `public/` and are ignored locally.
- `supabase/schema.sql` creates `public-assets` and `protected-datasets` buckets and RLS for paid users.
- Admin upload can replace the protected CSV, but there is no import validation, source-run audit, or rollback metadata yet.

## Current access tiers
- `free_preview`, `report_buyer`, `alerts_subscriber`, `dashboard_starter`, `dashboard_pro`, `dashboard_investor`, `admin`.
- Starter: full listing database.
- Pro: exports, lead cards, saved leads, notes, data quality tools.
- Investor: agency contacts, priority workflows, investor tools.
- Free/alerts: 10 rows; report buyer: 50 rows.

## Backend endpoints
- `/api/create-checkout-session`: Stripe subscription checkout with Supabase auth.
- `/api/create-billing-portal-session`: Stripe billing portal.
- `/api/stripe-webhook`: Stripe subscription/profile entitlement sync.
- `/api/capture-lead`: free-tier/sample lead capture; schema/env mismatch should be reviewed.
- `/api/save-alert-preferences`: alert preference upsert.
- `/api/cron/send-alerts`: daily digest from protected CSV.

## Missing pieces
1. GIS/source schema for `properties`, `parcels`, `property_tax_cards`, `gis_layers`, `off_market_candidates`, `source_registry`, `source_audit_logs`, snapshots, changes.
2. Data source registry and daily GIS refresh workflow.
3. County GIS/ArcGIS REST integration model.
4. Tax-card/property-record model.
5. Off-market scoring model.
6. Feature-level gates for GIS/tax/off-market features.
7. Toggleable map layer control and locked state UX.
8. Competitive/data-source research reports.
9. Backend APIs for GIS/parcel/tax/off-market queries.

## Recommended implementation plan
1. Add non-breaking documentation, source registry, schema draft, and automation prompt.
2. Centralize feature gates.
3. Add GIS/listing/off-market TypeScript scaffolding.
4. Patch current map template interpolation bug.
5. Add map layer control/legend scaffolding without loading heavy remote layers yet.
6. Preserve current CSV dashboard flow until schema/import jobs are validated.
7. Run typecheck/build before claiming success.

## Risks
- County GIS endpoints are fragmented and many need verification.
- qPublic/tax-card automation may have terms restrictions.
- MLS/IDX/RESO requires authorization; it is not open data.
- Client-side CSV download will not scale to full parcel/owner/tax datasets.
- Protected datasets, owner/tax records, provider keys, and service-role keys must never be exposed in `public/` or `VITE_*` values.
