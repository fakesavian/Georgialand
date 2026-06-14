# Georgia Parcel / Property-Line / Zoning API Research

Date: 2026-06-07
Project: Georgia Land Finder / freelandfinder
Task owner: Savian

## Executive Summary

The current map GIS overlays are placeholders. Real parcel/property-line and zoning overlays require authoritative geometry from county/city GIS systems or a paid parcel/zoning vendor.

Key conclusions:

1. **There is no authoritative free statewide Georgia parcel/property-line API found.** Parcels are maintained county-by-county, usually by tax assessor/GIS departments.
2. **There is no authoritative free statewide Georgia zoning API found.** Zoning is usually city/county planning data and may differ inside city limits vs unincorporated county.
3. **Free launch path:** start with public county/city ArcGIS REST services where available, plus federal/state free due-diligence layers.
4. **Paid scale path:** use a commercial parcel aggregator for normalized parcel geometry statewide/nationwide, and a zoning vendor for jurisdiction-normalized zoning.
5. **The app must retain source metadata and disclaimers:** parcel lines are not surveys; zoning must be verified with the local jurisdiction.

## Current Site County Priority List

Extracted from `public/local_dashboard_dataset.csv` / `georgia_low_cost_land_opportunities_enriched.csv`.

| County | Current listings | Priority |
|---|---:|---|
| Fulton | 16 | P0 |
| DeKalb | 6 | P0 |
| Richmond / Augusta | 5 | P0 |
| Ware | 5 | P0 |
| Chatham / SAGIS | 3 | P1 |
| Clayton | 3 | P1 |
| Bibb / Macon | 2 | P1 |
| Clarke / Athens-Clarke | 2 | P1 |
| Bartow | 1 | P2 |
| Cobb | 1 | P2 |
| Dougherty | 1 | P2 |
| Floyd | 1 | P2 |
| Glynn | 1 | P2 |
| Gwinnett | 1 | P2 |
| Houston | 1 | P2 |
| Lowndes | 1 | P2 |
| Muscogee / Columbus | 1 | P2 |
| Spalding | 1 | P2 |
| Sumter | 1 | P2 |

## Confirmed / Candidate Public County-City GIS Sources

These are source candidates found through public ArcGIS portal/service searches and endpoint metadata checks. Confidence means confidence that the URL is a real public GIS source, not that it is sufficient for all parcels/zoning in that county.

| Jurisdiction / County | Source | URL | Data Found | API / Download Type | Cost | Auth | Confidence | Notes |
|---|---|---|---|---|---|---|---|---|
| Ware County | Ware County GIS public geodatabase | `https://services9.arcgis.com/XAyIBOsw3fLfDjTY/arcgis/rest/services/WareCounty_Base_gdb/FeatureServer` | Parcels, lot lines, land lots, county zoning, land use, flood, soils, easements, building footprints, county/city limits | ArcGIS FeatureServer | Free public service | No token seen | High | Best free connector candidate found. Layer 38 = `Parcels`; layer 25 = `County_Zoning`; layer 18 = `LotLines`; layer 31 = `Waycross_Area_LandUse`. |
| Johns Creek / Fulton County | Johns Creek Parcels | `https://services1.arcgis.com/bqfNVPUK3HOnCFmA/arcgis/rest/services/Parcels/FeatureServer` | Parcel polygons with ParcelID, address, owner, assessment fields | ArcGIS FeatureServer | Free public service | No token seen | Medium | Covers Johns Creek only, not all Fulton. Description says parcels originally from Fulton Tax Assessors with topology corrections by Johns Creek GIS. Useful for Fulton subset. |
| City of Atlanta / Fulton-DeKalb | City of Atlanta DCP GIS | `https://services5.arcgis.com/5RxyIIJ9boPdptdo/arcgis/rest/services/` examples include `Official_NPU`, `Counties`, parks | NPU/neighborhood/planning/context layers | ArcGIS FeatureServer | Free public service | No token seen | Medium | Useful for Atlanta planning context; not yet confirmed as full parcels or zoning. Need direct Atlanta zoning/parcel layer endpoint search. |
| DeKalb County | DeKalb Tax Parcels item | Item: `https://www.arcgis.com/home/item.html?id=4f5af990bd084645b693f5f065356665`; service root found: `https://services2.arcgis.com/IxVN2oUE9EYLSnPE/arcgis/rest/services/TaxParcels/FeatureServer` | Tax parcel layer claimed by item metadata | ArcGIS FeatureServer | Unknown | **Token required on direct query** | Low / Blocked | ArcGIS item exists, but direct `/0/query` returned token required. Do not use until a public endpoint or permission/license is verified. |
| Peachtree Corners / Gwinnett | Peachtree Corners Parcels 2026 | `https://services3.arcgis.com/jEYjQXUX2JTVoctH/arcgis/rest/services/PTC_Parcels_2022/FeatureServer` | Parcel polygons with PIN, address, acreage fields | ArcGIS FeatureServer | Free public service | No token seen | Medium | Covers City of Peachtree Corners, not all Gwinnett. Useful if current listing is inside city. |
| Glynn County | County Owned Parcels | `https://services.arcgis.com/5iWzb1srkjPDXmpL/arcgis/rest/services/County_Owned_Parcels/FeatureServer` | County-owned parcel polygons | ArcGIS FeatureServer | Free public service | No token seen | Medium | Only county-owned parcels, not full county parcel fabric. Useful for surplus/public ownership leads. |
| Glynn County | TaxCommissioner_LibertyHarbor | `https://services.arcgis.com/5iWzb1srkjPDXmpL/arcgis/rest/services/TaxCommissioner_LibertyHarbor/FeatureServer` | Liberty Harbor parcels | ArcGIS FeatureServer | Free public service | No token seen | Low-Medium | Subarea-specific. Not enough for countywide coverage. |
| Chatham / SAGIS | SAGIS portal | `https://www.sagis.org/` | Expected parcel/local GIS layers | GIS portal / possible downloads | Public portal; terms vary | Unknown | Medium, needs endpoint discovery | SAGIS is the authoritative Savannah/Chatham GIS starting point, but a direct FeatureServer/download endpoint was not confirmed in this pass. |
| Bibb / Macon | Parcel Data 2019 item | `https://services2.arcgis.com/zPFLSOZ5HzUzzTQb/arcgis/rest/services/ParcelData2019/FeatureServer` | 2019 parcel assessment locations | ArcGIS FeatureServer | Free public service | Unknown | Low-Medium | Older 2019 data. Needs authoritative current Macon-Bibb GIS confirmation before production. |
| Clayton, Cobb, Richmond/Augusta, Athens-Clarke, Bartow, Dougherty, Floyd, Houston, Lowndes, Muscogee, Spalding, Sumter | Various county GIS/qPublic/planning portals likely exist | County/city GIS and assessor websites | Parcels, tax cards, zoning may be available by portal/download | Mixed: ArcGIS, qPublic, custom GIS, PDF zoning maps | Usually public view; bulk/API varies | Mixed | Needs manual endpoint inventory | ArcGIS public search did not return clean countywide public parcel/zoning FeatureServers in this pass. These need targeted portal-by-portal discovery. |

## Ware County Layer Details Verified

Endpoint: `https://services9.arcgis.com/XAyIBOsw3fLfDjTY/arcgis/rest/services/WareCounty_Base_gdb/FeatureServer`

Important layers:

| Layer ID | Name | Geometry | Recommended Use |
|---:|---|---|---|
| 18 | `LotLines` | Polyline | Actual line overlay candidate |
| 25 | `County_Zoning` | Polygon | Real zoning overlay candidate |
| 31 | `Waycross_Area_LandUse` | Polygon | Land use / parcel-style context; query count verified: 4,653 |
| 32 | `Ware_County_CurrentLU` | Polygon | Current land-use overlay; query count verified: 28 |
| 33 | `Ware_County_CharacterAreas` | Polygon | Planning/character-area overlay; query count verified: 58 |
| 37 | `Parcels_Soils` | Polygon | Parcel/soils overlay candidate |
| 38 | `Parcels` | Polygon | Parcel boundary source candidate |
| 6 | `Right_of_way` | Polygon | ROW/access context |
| 36 | `Easements` | Polyline | Encumbrance/access context |

## Free Statewide / Federal Supporting Layers

These do **not** replace parcel/zoning data, but they are strong free layers for due diligence.

| Source | URL / API | Provides | Parcel Lines? | Zoning? | Cost/Auth | Recommended App Use |
|---|---|---|---|---|---|---|
| FEMA National Flood Hazard Layer | `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer` | Flood zones, floodways, FIRM panels, BFEs | No | No | Free, no auth generally | Flood overlay/risk card. |
| US Census TIGERweb / TIGER Line | `https://tigerweb.geo.census.gov/arcgis/rest/services/`; downloads `https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html` | Counties, places, tracts, roads, boundaries | No | No | Free | County/city/census boundary context. |
| USDA NRCS Soil Data Access / SSURGO | `https://sdmdataaccess.nrcs.usda.gov/` and WFS `https://sdmdataaccess.nrcs.usda.gov/Spatial/SDMWGS84Geographic.wfs` | Soil map units, hydric soils, farmland class, drainage | No | No | Free | Soil/buildability/farm suitability overlays. |
| USFWS National Wetlands Inventory | `https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer`; downloads `https://www.fws.gov/program/national-wetlands-inventory/download-state-wetlands-data` | Wetlands polygons/classes | No | No | Free | Wetland screening. Not a legal delineation. |
| USGS National Map / 3DEP / NHD | `https://apps.nationalmap.gov/services/`; topo `https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer`; elevation `https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer`; hydro `https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer` | Topo, elevation, hydrography, contours | No | No | Free | Slope/terrain/water context. |
| GDOT Geoportal | `https://gdot-geoportal-gdot.hub.arcgis.com/` | Roads, routes, bridges, transportation layers | No | No | Free public layers | Road/access and infrastructure context. |
| Georgia GIS Clearinghouse / GIO | `https://data.georgiaspatial.org/` | State GIS datasets and discovery | Usually no statewide parcel layer | Usually no statewide zoning layer | Free dataset-dependent | Discovery and statewide framework layers. |
| EPA EJScreen / ECHO / Envirofacts | `https://www.epa.gov/ejscreen`; `https://echo.epa.gov/tools/web-services`; `https://enviro.epa.gov/` | Environmental justice, regulated facilities, compliance | No | No | Free | Environmental risk/proximity context. |
| PAD-US / NCED / NLCD | PAD-US `https://www.usgs.gov/programs/gap-analysis-project/science/pad-us-data-download`; NCED `https://www.conservationeasement.us/`; NLCD `https://www.mrlc.gov/` | Protected areas, conservation easements, land cover | Not cadastral parcels | No | Free | Public/conserved land, land-cover context. |

## Commercial Paid API / Vendor Shortlist

Pricing notes are intentionally conservative. If pricing was not publicly confirmed, mark it as quote/contact-sales.

| Vendor | URL | Data Provided | Parcel Geometry? | Zoning? | API? | Public Pricing / Cost | Recommendation |
|---|---|---|---|---|---|---|---|
| Regrid / Landgrid | `https://regrid.com/api` | US/Canada parcel boundaries, parcel attributes, tiles/API, some contextual datasets | Yes | Limited/varies; not a zoning-first product | Yes | Public pricing not confirmed in fetch; likely subscription/enterprise/contact sales | Best paid parcel-geometry fallback for normalized nationwide parcel fabric. Evaluate first for parcel boundary display. |
| ATTOM | `https://www.attomdata.com/` / property data API pages | Property, tax, deed, sale, valuation, owner, mortgage-style attributes | May include property/location data; parcel geometry depends product/license | No/limited | Yes | Quote/contact sales; API page changed/404 in fetch | Strong enrichment source for owner/tax/deed/sales. Pair with Regrid/LightBox if geometry needed. |
| LightBox | `https://www.lightboxre.com/` | Parcel, property, environmental, location intelligence, geospatial datasets | Yes in parcel products | May have land-use/zoning-related products depending package | Yes/enterprise | Quote/contact sales; page blocked fetch | Enterprise-grade parcel/location vendor. Consider when budget supports broader licensing. |
| CoreLogic | `https://www.corelogic.com/` | Property/tax/deed/mortgage/valuation datasets | Product-dependent | No/limited | Enterprise APIs | Quote/contact sales | Large enterprise property data provider; likely expensive but strong coverage. |
| Precisely | `https://www.precisely.com/` | Property attributes, boundaries, geospatial enrichment | Product-dependent | Not primary zoning | APIs/data products | Quote/contact sales; page blocked fetch | Good enterprise enrichment/boundary data option. |
| First American DataTree | `https://www.datatree.com/` | Property, owner, tax, deed, document/title-related data | Product-dependent | No/limited | Yes/enterprise | Quote/contact sales | Useful for title/deed/tax enrichment, not primarily zoning geometry. |
| Estated | `https://estated.com/` | Property/tax/owner/valuation API | Geometry likely limited compared with parcel fabric vendors | No | Yes | Public pricing pages not confirmed in fetch; historically API subscription/contact | Good lower-friction property attributes API candidate; verify current availability/pricing. |
| PropertyRadar | `https://www.propertyradar.com/pricing` | Property owner/lead lists, marketing/property intelligence | Not primarily parcel boundary GIS | No | API mentioned but not primary GIS | Has public pricing page, exact amounts not extracted in this pass | More of lead/prospecting product than map geometry source. Lower priority for parcel lines. |
| Gridics | `https://gridics.com/products/zoning-data-api/` | Parcel-specific zoning API and zoning interpretation | Parcel-specific zoning, not necessarily parcel fabric source | Yes | Yes | Public page says usage-based pricing / per request, exact rate not confirmed | Strong zoning API candidate if Georgia jurisdiction coverage fits. Evaluate for zoning overlays/allowed-use summaries. |
| Zoneomics | `https://www.zoneomics.com/` | Zoning data, zoning reports/API | Parcel-specific zoning lookup; parcel geometry not primary | Yes | Yes | Pricing not confirmed; likely subscription/contact/API plans | Zoning-focused vendor. Evaluate coverage for Georgia cities/counties. |
| Cherre / Local Logic / Placer-type vendors | Vendor-specific | Real estate data aggregation/context | Varies | Varies | Yes/enterprise | Quote | Not first choice for parcel lines; can enrich later. |

## Recommended Free-First Implementation Plan

### Phase 1 — Stop showing fake squares

1. Keep property pins.
2. Disable placeholder parcel/zoning rectangles unless real geometry is available.
3. For each property, show layer status:
   - `Parcel boundary: verified source available`
   - `Parcel boundary: source pending`
   - `Zoning: verified source available`
   - `Zoning: source pending`
4. Add source metadata to map overlays: agency, endpoint, layer ID, last checked, confidence.

### Phase 2 — Current county connectors

Build connectors in this order:

1. **Ware County** — confirmed public parcel/zoning/land-use FeatureServer.
2. **Johns Creek / Fulton subset** — confirmed parcel polygons but city subset only.
3. **Peachtree Corners / Gwinnett subset** — confirmed parcel polygons but city subset only.
4. **Glynn county-owned parcels** — useful for public-owned/surplus layer, not full parcel fabric.
5. **SAGIS / Chatham** — high priority manual endpoint discovery.
6. **Fulton/Atlanta, DeKalb, Richmond/Augusta, Clayton, Bibb/Macon, Athens-Clarke** — manual portal endpoint discovery and licensing check.

### Phase 3 — All 159 Georgia counties

Create a `county_gis_source_registry` table/file with one row per Georgia county plus separate city zoning sources where applicable.

Required fields:

- county FIPS
- county name
- assessor website
- GIS website
- parcel API endpoint
- parcel download endpoint
- zoning API endpoint
- zoning download/PDF source
- city-specific zoning source needed? yes/no
- qPublic/Beacon/CAMA vendor
- ArcGIS Hub/REST root
- auth required
- cost / fee schedule
- license/terms URL
- geometry type
- owner fields allowed for display? yes/no/unknown
- last checked
- connector status: `not_started`, `found`, `verified_query`, `ingested`, `blocked`, `paid_only`
- confidence

### Phase 4 — Paid coverage decision

If free county inventory cannot cover enough counties fast, evaluate paid vendors:

- Parcel geometry: Regrid vs LightBox vs CoreLogic/Precisely.
- Property attributes: ATTOM vs DataTree vs Estated.
- Zoning: Gridics vs Zoneomics.

Decision criteria:

- Georgia county coverage
- parcel geometry precision
- zoning jurisdiction coverage
- API rate limits
- redistribution/display rights
- owner-name display rights
- bulk export rights
- monthly cost at expected usage
- ability to cache geometry in our DB

## Product Rules To Add

1. **Never draw fake parcel boundaries.** If no source geometry exists, show `Parcel boundary source pending`.
2. **Zoning must be jurisdiction-specific.** A property inside a city may need city zoning, not county zoning.
3. **Parcel lines are not surveys.** Label all parcel boundaries as assessor/GIS parcel fabric, not legal survey boundaries.
4. **Cache geometries by source and date.** Do not query county APIs live for every pan/zoom once traffic grows.
5. **Source confidence matters.** Only show real GIS lines when connector status is `verified_query` or better.

## Immediate Next Build Recommendation

Replace placeholder rectangle logic in `MapView` with a real-source gate:

- `parcel boundary` layer renders only if the selected property has `parcel_geometry_source_id` and geometry.
- `zoning` layer renders only if a jurisdiction zoning feature intersects the property point/parcel.
- If source is missing, layer panel shows `Needs source` rather than drawing fake lines.

Start connector prototype with Ware County because it has public parcel and zoning layers in one verified FeatureServer.

## Evidence Collected

- Current county list extracted from `public/local_dashboard_dataset.csv`.
- Existing source registry read from `data/source_registry.json`.
- Existing report read from `reports/DATA_SOURCE_API_INVENTORY.md`.
- Ware ArcGIS FeatureServer root verified and layer list queried.
- Johns Creek parcel FeatureServer metadata queried.
- Peachtree Corners parcel FeatureServer metadata queried.
- Glynn county-owned parcels FeatureServer metadata queried.
- DeKalb tax parcel service direct query returned token required.
- Federal/state source findings from public API/service research.

## Open Research Items

These need targeted follow-up before production:

1. Confirm direct SAGIS/Chatham parcel and zoning endpoints or download workflow.
2. Confirm Augusta-Richmond parcel/zoning GIS endpoints.
3. Confirm Fulton County countywide parcel endpoint, separate from Johns Creek subset.
4. Confirm City of Atlanta zoning and parcel/planning overlay endpoints.
5. Confirm DeKalb public parcel/zoning source that does not require token.
6. Confirm all remaining current counties manually.
7. Build all-159 county source registry.
8. Request formal vendor quotes for Regrid, Gridics, Zoneomics, ATTOM, LightBox.
