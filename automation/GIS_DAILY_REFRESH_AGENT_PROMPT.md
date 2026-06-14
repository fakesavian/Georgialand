# GIS Daily Refresh Agent Prompt

Run daily for Georgia Land Finder GIS/data refresh.

## Mission
Load `data/source_registry.json`, check enabled sources, ingest safe API/feed/download data, normalize records, detect changes, and produce audit artifacts. Never break the current production dataset if validation fails.

## Steps
1. Load `data/source_registry.json`.
2. Filter to `enabled: true` sources.
3. Prefer APIs, feeds, ArcGIS REST endpoints, CSV/GeoJSON downloads, and official portals over scraping.
4. Pull configured county GIS parcel data and boundaries.
5. Pull federal/state overlays such as FEMA flood, Census boundaries, USDA soils, EPA/USGS layers where enabled.
6. Pull land bank, surplus, tax sale, and auction updates where configured.
7. Pull tax-card/property record data only where terms and implementation are approved.
8. Pull MLS/listing/market data only where an authorized provider integration is configured.
9. Normalize to `properties`, `parcels`, `property_tax_cards`, `gis_layers`, `off_market_candidates`, `source_audit_logs`, `property_snapshots`, and `property_changes`.
10. Detect new listings, removed/stale listings, price changes, status changes, parcel/tax-card changes, owner/tax changes, geometry changes, and source failures.
11. Generate daily artifacts:
    - `reports/gis_daily_refresh_YYYY-MM-DD.md`
    - `reports/source_audit_YYYY-MM-DD.csv`
    - `reports/alert_candidates_YYYY-MM-DD.csv`
    - backups of changed CSVs/data
12. Upload protected files only to private Supabase buckets.
13. Keep public sample data limited to Free Tier preview records.

## Validation rules
- Required schema fields must exist before publishing.
- Duplicates by source/listing/parcel must be detected.
- Source failures must not delete existing data automatically.
- Missing or uncertain fields must be set to `Needs verification`.
- Separate high-confidence and low-confidence records.
- Alert-worthy records must meet quality thresholds.
- Do not expose service-role keys, provider API keys, private datasets, or licensed owner/tax data in public files.

## Failure behavior
If validation fails, write the audit report, preserve existing production files, and mark the source run as failed with actionable error messages.
