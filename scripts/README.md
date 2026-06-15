# Parcel-boundary data-quality scripts

Accuracy rule: geometry is only ever taken from official county ArcGIS parcel
layers. Rows that cannot be verified are **flagged**, never given a fabricated
boundary. The production dataset is never overwritten automatically.

## Audit — which rows are boundary-ready?

```bash
node scripts/audit-parcel-boundaries.mjs            # audits public/local_dashboard_dataset.csv
node scripts/audit-parcel-boundaries.mjs path.csv   # audit a specific CSV (e.g. the enriched copy)
```

Writes to `data/reports/`:
- `parcel-boundary-audit-<date>.json` — summary + per-county breakdown
- `parcel-boundary-not-ready-<date>.csv` — every row not yet boundary-ready, with the reason

## Backfill — fetch verified geometry from county GIS

Writes an **enriched copy** (`public/local_dashboard_dataset.enriched.csv`, gitignored);
it does not touch the input.

```bash
# small live sample (<=3 coordinate-bearing rows per verified county)
node scripts/backfill-parcel-boundaries.mjs --sample --limit 3

# one county, capped
node scripts/backfill-parcel-boundaries.mjs --county dekalb --limit 25

# one listing
node scripts/backfill-parcel-boundaries.mjs --listing GA-034

# full backfill of every queryable-county row
node scripts/backfill-parcel-boundaries.mjs

# custom in/out
node scripts/backfill-parcel-boundaries.mjs --in public/local_dashboard_dataset.csv --out public/local_dashboard_dataset.enriched.csv
```

Each processed row gets: `Parcel_Boundary_GeoJSON`, `Parcel_Boundary_Verified`,
`Parcel_Boundary_Confidence_0_to_100`, `Parcel_Boundary_Method`
(`point_in_polygon` | `parcel_id_match` | `none`), `Parcel_Boundary_Source_Type`,
`Parcel_Boundary_Source_URL`, `Parcel_Boundary_Last_Checked_Date`,
`Parcel_Boundary_Error`.

Confidence: point-in-polygon + parcel-ID match = 96; point-in-polygon only = 80;
parcel-ID match only = 90; unverifiable = 0 (flagged).

## Promote to production (human-reviewed)

1. Run the full backfill, then re-audit the enriched copy:
   `node scripts/audit-parcel-boundaries.mjs public/local_dashboard_dataset.enriched.csv`
2. Spot-check verified geometries on the map (red boundary should sit on the lot).
3. Review the flagged rows (`*-not-ready-*.csv`) — backfill where a better
   parcel ID / coordinate exists, or leave flagged.
4. Only then copy the reviewed enriched file over `public/local_dashboard_dataset.csv`
   (and upload to the Supabase `protected-datasets` bucket for production).

## County coverage

Verified ArcGIS parcel endpoints: Fulton, DeKalb, Gwinnett, Floyd, Ware
(+ researched: Clarke, Forsyth, Cherokee, Cobb, Clayton). Placeholder/portal-only
counties (Richmond, Bibb, Chatham, etc.) are flagged for manual verification —
see `src/lib/dataSources/sourceRegistry.ts`.
