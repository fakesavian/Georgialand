# County GIS Source Registry Standard

**Date:** 2026-06-15
**Purpose:** Define how Georgia county parcel/GIS sources are recorded and verified
so the parcel-boundary pipeline only ever draws **real, official** geometry.

## Where the registry lives

- `src/lib/dataSources/sourceRegistry.ts` — the typed, queryable registry the app
  uses at runtime (per-county `arcgisConfig`, `parcelIdField`, `connectorStatus`,
  `isPlaceholder`, `baseConfidence`). This is the source of truth for live lookups.
- `data/county_gis_source_registry.json` — broad metadata scaffold for all 159
  Georgia counties (endpoints, layer ids, status, last-checked).
- `scripts/lib/parcelGis.mjs` — the script-side mirror (`COUNTY_CONFIG`) used by the
  audit/backfill scripts.

When adding/verifying a county, update the typed registry first, then mirror the
endpoint into `parcelGis.mjs` so scripts and app stay aligned.

## Required fields per county source

| Field | Meaning |
|---|---|
| `county` | lowercase slug matching `LandProperty.County` |
| `provider` / `sourceName` | agency operating the GIS (e.g. "DeKalb County GIS") |
| `gisPortalUrl` | public GIS portal landing page |
| `arcgisConfig.serviceUrl` | exact FeatureServer/MapServer **layer** query endpoint |
| `arcgisConfig.serviceType` | `FeatureServer` \| `MapServer` |
| `arcgisConfig.parcelIdField` | parcel-ID attribute field name (e.g. `ParcelID`, `PARID`, `PIN`, `PARCEL`) |
| address / owner / acreage / land-use fields | per-county attribute names (see `COUNTY_FIELD_MAPS`) |
| geometry support | does the layer return polygon geometry? |
| output SR | must be requestable as `outSR=4326` (WGS84) |
| query method | `parcel_id`, `point_envelope`, `extent`, `where` |
| rate-limit / caution notes | throttling, auth, quirks |
| terms / usage notes | public vs restricted; attribution |
| `connectorStatus` | `verified` \| `researched` \| `placeholder` \| `broken` |
| `last_checked` | ISO date the endpoint was last confirmed |

## Verification protocol (do not mark `verified` without a real query)

1. Open the GIS portal, find the parcel layer's REST endpoint.
2. Run a live `query`:
   `?<where or geometry>&outFields=*&returnGeometry=true&outSR=4326&f=geojson`
3. Confirm it returns a Polygon/MultiPolygon inside Georgia bounds with a populated
   parcel-ID field.
4. Only then set `connectorStatus: 'verified'`, `isPlaceholder: false`, and
   `last_checked`. Anything unconfirmed stays `researched` or `placeholder`.

## Current status (from the parcel-boundary task, re-confirmed 2026-06-15)

- **Verified, queryable:** Fulton, DeKalb, Gwinnett, Floyd, Ware.
- **Researched (endpoint known, not fully confirmed):** Clarke (returned HTTP 400 in
  testing — needs query-format fix), Forsyth, Cherokee, Cobb, Clayton.
- **Placeholder (no confirmed REST endpoint — flag, never guess):** Richmond, Bibb,
  Chatham, Douglas, Henry, Rockdale, Muscogee, Dougherty, Lowndes, Glynn, Fayette.

Outbound ArcGIS connectivity was confirmed (Esri sample server + county layers
respond), so verification of new counties can be done live.

## Boundary verification pipeline (alignment with the parcel-boundary task)

`scripts/lib/parcelGis.mjs` → `fetchParcelGeometry()` already implements the agreed
priority and is the single place to extend:

1. **Point-in-polygon first** — query the parcel layer by a small envelope around the
   listing lat/lon, accept geometry only when **exactly one** official polygon
   contains the point (most robust; immune to parcel-ID format drift).
2. **Parcel-ID match** — `LIKE` query then normalized exact-match filter.
3. **(Future) address lookup** — only if 1 and 2 fail.
4. **Official GIS/assessor deep link** — fallback for manual verification.
5. **No fake boxes** — approximate coordinates are never turned into a polygon.

Every result carries `method`, `confidence` (point+ID match 96 / point 80 / ID 90 /
none 0), `sourceUrl`, `last checked`, and an `error` reason when unverified.

## Re-run checks

```bash
node scripts/audit-parcel-boundaries.mjs           # boundary readiness baseline
node scripts/backfill-parcel-boundaries.mjs --county <slug> --limit 5   # verify a county live
```
