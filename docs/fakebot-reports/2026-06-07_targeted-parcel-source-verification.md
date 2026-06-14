# Targeted Parcel Source Verification

Date: 2026-06-07
Project: Georgia Low-Cost Land Finder / freelandfinder

## Summary

Completed the targeted follow-up pass requested by Savian:

1. Find parcel-specific listings for the 5 generic program rows.
2. Verify GA-053 / WA0607 220 Bailey Street through Ware County / Waycross-Ware records.
3. Replace dead/blocked source deep links with browser-confirmed current official URLs where available.

No parcel facts were fabricated. Rows that could not be verified were left unresolved with explicit status notes.

## Rows Reviewed

- GA-003 — Metro Atlanta Land Bank side-lot / generic program row
- GA-006 — Fulton County tax-sale / generic program row
- GA-007 — DeKalb County tax-sale / generic program row
- GA-012 — Fulton County surplus real estate / generic program row
- GA-027 — GovDeals Atlanta/metro government auction / generic program row
- GA-053 — Waycross-Ware Land Bank WA0607 220 Bailey Street

## Results

### GA-003 — Replaced Generic MALB Program Row

Updated to parcel-specific listing:

- Address: `0 Crescendo Dr NW, Atlanta, GA 30318`
- Parcel: `14 020900020883`
- Official portal: `https://metroatlantalandbank.epropertyplus.com/landmgmtpub/app/base/landing`
- Program/source page: `https://metroatlantalandbank.org/service/side-lot-disposition/`
- GIS source: `https://services1.arcgis.com/AQDHTHDrZzfsFsB5/arcgis/rest/services/Tax_Parcels/FeatureServer/0`
- Fulton GIS evidence:
  - Address: `0 CRESCENDO DR NW`
  - Owner: `FULTON COUNTY & CITY OF ATLANTA LAND BANK AUTHORITY`
  - Acres: `0.2815`
  - Coordinates: GIS polygon centroid `33.774527975976, -84.478192922530`
- Verification level: `parcel_specific_official_portal_plus_gis`
- Data confidence: `88`

### GA-006 — Fulton Tax Sale Still Unresolved as Parcel

Did not replace with a parcel because no active parcel sale list was exposed.

Browser-confirmed current source:

- `https://www.fultoncountyga.gov/Inside-Fulton-County/Fulton-County-Departments/Sheriff/Tax-Sales`

Finding:

- Official page says no July 2026 levy sale.
- Tax Sale List accordion did not expose a parcel-specific list in this browser session.
- Row remains a watch-list/program row.

Updated status:

- `browser_confirmed_current_program_page_no_active_parcel_list`
- Verification level: `official_program_page_only_no_current_parcel`
- Data confidence: `62`

### GA-007 — Replaced Generic DeKalb Tax-Sale Row

Updated to parcel-specific official DeKalb tax-sale list row:

- Address: `2718 Windrock Ct, DeKalb County, GA`
- Parcel: `15 009 01 033`
- Official source: `https://dekalbtax.org/property-tax/tax-sales/`
- Official public listing: `https://publicaccess.dekalbtax.org/forms/htmlframe.aspx?mode=content/search/tax_sale_listing.html`
- Browser-confirmed table values:
  - Tax Sale Date: `07-JUL-2026`
  - Tax Sale ID: `25-R30266653-JUL`
  - Owner: `TIGER PAW PROPERTIES LLC`
  - Address: `2718 WINDROCK CT`
  - Total Tax Due: `$5,081.87`

Coordinates were not written because public geocoding did not return an exact match and qPublic/GIS was not fully accessible in this pass.

Updated status:

- `browser_confirmed_official_tax_sale_listing`
- Verification level: `parcel_specific_official_tax_sale_list_coordinates_pending`
- Data confidence: `82`

### GA-012 — Replaced Generic Fulton Surplus Row

Updated to parcel-specific official Fulton surplus listing:

- Address: `0 Keels Ln, South Fulton, GA 30349`
- Parcel: `13 016000020296`
- Official source/page: `https://www.fultoncountyga.gov/Inside-Fulton-County/Fulton-County-Departments/Real-Estate-and-Asset-Management/Land-Division/Surplus-Real-Estate-for-Sale`
- GIS source: `https://services1.arcgis.com/AQDHTHDrZzfsFsB5/arcgis/rest/services/Tax_Parcels/FeatureServer/0`
- Browser-confirmed Fulton surplus page showed:
  - `0 KEELS LANE, SOUTH FULTON, GEORGIA 30349`
  - `13-0160-0002-029-6`
- Fulton GIS evidence:
  - Address: `0 KEELS LN`
  - Owner: `FULTON COUNTY`
  - Acres: `2.17`
  - Coordinates: GIS polygon centroid `33.571072872147, -84.497649472636`

Updated status:

- `browser_confirmed_official_surplus_page_and_fulton_gis_confirmed`
- Verification level: `parcel_specific_official_surplus_page_plus_gis`
- Data confidence: `90`

### GA-027 — GovDeals Still Unresolved

Could not browser-confirm a parcel-specific listing.

Attempted source:

- `https://www.govdeals.com/search?category=Land`

Finding:

- GovDeals returned `Access Denied` in browser.
- No active Georgia government real-estate/land auction listing was confirmed from this environment.
- Row remains unresolved rather than replaced with unverified auction data.

Updated status:

- `blocked_by_govdeals_access_denied_unresolved`
- Verification level: `unresolved_blocked_source`
- Data confidence: `45`

### GA-053 — Waycross-Ware Land Bank Confirmed, Parcel Still Unresolved

Official listing confirmed:

- `https://www.waycrossga.gov/191/WaycrossWare-County-Land-Bank-Authority`

Finding:

- Official Waycross-Ware County Land Bank page includes `WA0607 220 Bailey Street` in the current property list.
- Valid WareCountyGAGIS ArcGIS service found:
  - `https://services9.arcgis.com/XAyIBOsw3fLfDjTY/arcgis/rest/services/WareCounty_Base_gdb/FeatureServer`
- Public GIS queries for:
  - `220 Bailey`
  - `Bailey` address point
  - `WA0607`
  - parcel-like `0607`
  did not produce an exact parcel/address match.

Updated status:

- `browser_confirmed_land_bank_listing_gis_no_exact_parcel_match`
- Verification level: `official_land_bank_page_confirmed_parcel_unresolved`
- Data confidence: `65`

## Source Link Replacement Summary

Replaced dead/generic source links with current browser-confirmed URLs where possible:

- Fulton Tax Sales current page
- Fulton Surplus Real Estate current page
- DeKalb Tax Sales current page
- DeKalb public tax sale listing frame
- MALB side-lot program page
- MALB ePropertyPlus property portal
- Waycross-Ware official land-bank page
- valid WareCountyGAGIS ArcGIS service
- official Fulton GIS tax-parcel FeatureServer

## Snapshot

Created targeted source snapshot:

`docs/fakebot-reports/source-snapshots/source-url-snapshot-2026-06-07-targeted-parcel-pass.json`

Snapshot status counts:

- `ok`: 13
- `missing`: 2
- `http_403`: 2
- `error`: 1

Notes:

- Missing URLs are intentional where a parcel-specific page could not be verified.
- 403s are expected for some protected/blocked portals.

## Files Updated

- `public/local_dashboard_dataset.csv`
- `docs/fakebot-reports/source-snapshots/source-url-snapshot-2026-06-07-targeted-parcel-pass.json`
- `docs/fakebot-reports/2026-06-07_targeted-parcel-source-verification.md`

## Verification

CSV integrity:

- rows including header: 54
- columns: 135
- bad-width rows: none

Build checks:

```bash
npm run typecheck && npm run build
```

Result: passed.

## Remaining Blockers

- GA-006: wait for Fulton to publish a current parcel-specific tax sale list.
- GA-027: GovDeals must be checked manually in a non-blocked browser/session.
- GA-053: parcel ID and coordinates need manual Ware County / land-bank confirmation because public GIS did not match `220 Bailey` / `WA0607` exactly.

## Recommended Next Step

Do a manual browser session for blocked/protected sources:

1. GovDeals active Georgia land search.
2. Fulton Tax Sale List when next sale list is published.
3. Ware County / Waycross-Ware Land Bank staff or parcel lookup for WA0607 / 220 Bailey Street.
