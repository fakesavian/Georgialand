# Supabase GIS Expansion Setup

This document explains the optional GIS/backend expansion schema in `supabase/gis_expansion_schema.sql`.

## Required now
- Keep existing `supabase/schema.sql` and Supabase Storage buckets live for current CSV dashboard behavior.
- Apply `supabase/gis_expansion_schema.sql` only after reviewing it in staging or the Supabase SQL editor.
- The new schema is additive and does not replace the existing protected CSV flow.

## Future-ready tables
- `properties`: normalized listing/opportunity records.
- `parcels`: parcel attributes and optional `geometry_geojson` until PostGIS is enabled.
- `property_tax_cards`: owner/tax-card snapshots where licensing and source terms allow.
- `gis_layers`: layer catalog with access-tier minimums.
- `off_market_candidates`: generated parcel lead candidates and score factors.
- `source_registry`: authoritative registry for APIs/portals/downloads.
- `source_audit_logs`: source/import run history.
- `property_snapshots`: raw and normalized snapshots for change detection.
- `property_changes`: field-level changes for alerts and history.

## RLS approach
- Starter can read normalized properties and basic paid layers.
- Pro can read parcels and advanced GIS layers.
- Investor can read tax cards and off-market candidates.
- Admin can read source registry/audit records.
- Writes should happen through service-role ingestion jobs or Edge Functions, never from the browser.

## Storage buckets
Current buckets remain:
- `public-assets`: public sample only.
- `protected-datasets`: full paid CSV/report exports.

Future buckets to consider:
- `gis-cache`: simplified GeoJSON/PMTiles layer cache. Keep private unless explicitly public.
- `source-backups`: raw source downloads and run artifacts. Keep private.

## Access tier requirements
| Feature | Minimum tier |
|---|---|
| Free dashboard preview | Free Tier |
| Full listing database | Starter |
| County/city boundaries | Starter |
| Parcel boundary overlays | Pro |
| Zoning/flood/opportunity-zone overlays | Pro |
| Tax-card/owner data | Investor |
| Off-market candidates | Investor |
| Source registry admin | Admin |

## Operational rules
1. Validate imports before replacing production data.
2. Source failures must not delete existing records automatically.
3. Mark uncertain fields as `Needs verification`.
4. Store source attribution and last checked timestamp for every imported record.
5. Do not store provider-licensed owner/tax records in public assets.
