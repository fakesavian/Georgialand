# Red Parcel Boundary Map Layer

Date: 2026-06-07
Project: Georgia Low-Cost Land Finder / freelandfinder

## Summary

Implemented real red property-line boundaries on the dashboard map. These are not fake rectangles. They are rendered from verified public GIS parcel geometry where exact parcel IDs are available.

## User Requirement

Savian requested visible red property lines showing the exact boundary line on the map.

## What Changed

### 1. Real parcel boundary sources added

Added exact parcel polygon support for:

- Fulton County GIS Tax Parcels
  - `https://services1.arcgis.com/AQDHTHDrZzfsFsB5/arcgis/rest/services/Tax_Parcels/FeatureServer/0`
- DeKalb County GIS Tax Parcels 2025
  - `https://services2.arcgis.com/IxVN2oUE9EYLSnPE/arcgis/rest/services/Tax_Parcels_2025/FeatureServer/0`
- Existing Ware County GIS source remains wired for Ware parcel/zoning/lot-line overlays:
  - `https://services9.arcgis.com/XAyIBOsw3fLfDjTY/arcgis/rest/services/WareCounty_Base_gdb/FeatureServer`

### 2. Red boundary rendering

The `Parcel Boundaries` layer now renders verified parcel polygons as bright red outlines:

- stroke: `#ef4444`
- no fill
- glow/drop-shadow CSS class: `verified-parcel-boundary-red`

### 3. DeKalb GA-007 coordinate fix

GA-007 previously had an official DeKalb parcel polygon but no map coordinate, so the map could not center near it.

Updated GA-007 from official DeKalb parcel geometry:

- parcel: `15 009 01 033`
- address: `2718 Windrock Ct, DeKalb County, GA`
- latitude: `33.650139776587`
- longitude: `-84.279771020503`
- lot size: `0.474` acres, converted from official stated area `20,637 sq ft`

Note: DeKalb `CENTROID_X/Y` fields were null, so the coordinate was calculated from the official returned parcel polygon ring.

### 4. Usability fix: Zoom to property line

At statewide/full-dataset zoom, exact parcel boundaries are too small to read. Added an in-map button:

`Zoom to red property line`

This cycles through verified exact parcel polygons and zooms the map to a readable parcel-boundary view.

## Files Changed

- `src/lib/wareCountyGisConnector.ts`
- `src/components/dashboard/MapView.tsx`
- `src/lib/gisLayers.ts`
- `src/index.css`
- `src/lib/dataFetcher.ts`
- `public/local_dashboard_dataset.csv`

## Verification

### Build

Command:

```bash
VITE_LOCAL_DASHBOARD_BYPASS=true npm run typecheck && VITE_LOCAL_DASHBOARD_BYPASS=true npm run build
```

Result:

```text
✓ typecheck passed
✓ vite build passed
```

### Browser verification

Local preview:

```text
http://127.0.0.1:5205/dashboard
```

Browser smoke test confirmed:

```json
{
  "sourceFile": "local_dashboard_dataset.csv (LOCAL VERIFIED DATA)",
  "redStrokeCount": 3,
  "hasDeKalbRequest": true,
  "zoomControlPresent": true,
  "visibleRedStrokeCountAfterZoom": 1,
  "visibleRedBoundaryBBoxAfterZoom": {
    "w": 131,
    "h": 190,
    "x": 286,
    "y": 304
  }
}
```

FeatureServer requests observed:

- Fulton Tax Parcels: HTTP 200
- DeKalb Tax Parcels 2025: HTTP 200
- Ware County Base geodatabase: HTTP 200

Screenshots saved:

- `docs/fakebot-reports/source-snapshots/red-parcel-boundary-verification-2026-06-07.png`
- `docs/fakebot-reports/source-snapshots/red-parcel-boundary-zoomed-2026-06-07.png`

## Coverage

Currently exact red property boundaries are available where parcel IDs can be matched against verified public GIS services:

- GA-003 / Fulton / `14 020900020883`
- GA-007 / DeKalb / `15 009 01 033`
- GA-012 / Fulton / `13 016000020296`

Ware County overlays are loaded from verified Ware GIS, but GA-053 still lacks exact parcel match for `WA0607 / 220 Bailey Street`.

## Blockers / Remaining Work

- Not every county has a connector yet. Rows in counties without verified GIS connectors remain source-pending.
- DeKalb and Fulton exact parcel boundaries require parcel-specific IDs.
- GA-053 still needs a manual/official parcel match from Ware or Waycross-Ware Land Bank records.
- Production/protected Supabase dataset must be updated with the same parcel IDs/coordinates, otherwise production will not show the same local verified parcel lines.

## Recommendation

Next data pass should add county GIS connectors or paid parcel-boundary coverage for the remaining counties, then backfill exact parcel IDs so every listing can render a red boundary when available.
