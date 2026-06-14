# Map Layer Architecture — Georgia Land Finder

**Last updated:** 2026-06-07  
**Maintainer:** Dashboard & GIS Team  

This document describes every GIS map layer in the system: its data source, integration method, geometry type, access tier, update cadence, performance strategy, and fallback behavior.

---

## Layer Registry

### 1. Property Pins

| Field | Value |
|---|---|
| **Layer ID** | `property-pins` |
| **Layer Name** | Property Pins |
| **Type** | `property_pins` |
| **Geometry** | Point |
| **Endpoint Type** | `static` (CSV → in-memory) |
| **Data Sources** | Georgia Land Finder curated CSV (`georgia_low_cost_land_opportunities_enriched.csv`) |
| **Update Frequency** | On every CSV update (manual or automated pipeline) |
| **Access Tier** | `free_preview` (all users) |
| **Enabled by Default** | ✅ Yes |
| **Implementation Status** | ✅ Implemented |

**Integration:** CSV is parsed client-side by PapaParse. Lat/Lng fields are read directly from `Latitude` and `Longitude` columns. Leaflet markers are rendered via the `MapView` component.

**Performance Notes:** All points are loaded at once. For large datasets (>5,000 rows), consider lazy-loading via clustered marker libraries (e.g., `react-leaflet-cluster`). Currently bbox-filtered by map viewport is not implemented — all pins render.

**Fallback:** If lat/lng is missing or malformed, the property is silently skipped from the map (still visible in table/card views).

---

### 2. County Lines (County Boundaries)

| Field | Value |
|---|---|
| **Layer ID** | `county-boundaries` |
| **Layer Name** | County Lines |
| **Type** | `county_boundary` |
| **Geometry** | Polygon |
| **Endpoint Type** | `geojson` |
| **Data Sources** | US Census Bureau TIGERweb — Georgia county boundaries (GeoJSON) |
| **Data URL** | `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/` |
| **Update Frequency** | Annual (Census redistricting / boundary updates) |
| **Access Tier** | `dashboard_starter` ($39/mo) |
| **Enabled by Default** | ❌ No |
| **Locked Description** | "County boundaries unlock on Starter." |
| **Attribution** | US Census TIGERweb official county boundaries |
| **Color** | `#60a5fa` / opacity 0.55 |
| **Implementation Status** | ✅ Implemented (config wired; fetch via `censusBoundaryConnector.ts`) |

**Performance Notes:** GeoJSON is fetched once on layer enable and cached in component state. File is ~1–2 MB for Georgia's 159 counties. Render is low-cost after initial fetch.

**Fallback:** If Census API is unreachable, layer is silently skipped. A toast notification should be added in a future iteration.

---

### 3. City Lines (City/Place Boundaries)

| Field | Value |
|---|---|
| **Layer ID** | `city-boundaries` |
| **Layer Name** | City Lines |
| **Type** | `city_boundary` |
| **Geometry** | Polygon |
| **Endpoint Type** | `geojson` |
| **Data Sources** | US Census Bureau TIGERweb — incorporated/consolidated place boundaries |
| **Update Frequency** | Annual |
| **Access Tier** | `dashboard_starter` ($39/mo) |
| **Enabled by Default** | ❌ No |
| **Locked Description** | "City boundaries unlock on Starter." |
| **Attribution** | US Census TIGERweb incorporated/consolidated place boundaries |
| **Color** | `#a78bfa` / opacity 0.45 |
| **Implementation Status** | ✅ Implemented (config wired) |

**Performance Notes:** Similar to county layer. City/place GeoJSON for Georgia is larger (~5–8 MB for all incorporated places). Consider bbox filtering or lazy-loading only visible viewport.

**Fallback:** Layer silently skipped if Census endpoint fails.

---

### 4. Parcel Boundaries

| Field | Value |
|---|---|
| **Layer ID** | `parcel-boundaries` |
| **Layer Name** | Parcel Boundaries |
| **Type** | `parcels` |
| **Geometry** | Polygon |
| **Endpoint Type** | `arcgis_rest` |
| **Data Sources** | Ware County ArcGIS prototype; county GIS portals; future: paid parcel data vendor (Regrid, etc.) |
| **Update Frequency** | Varies by county (quarterly to annual) |
| **Access Tier** | `dashboard_pro` ($79/mo) |
| **Enabled by Default** | ❌ No |
| **Locked Description** | "Parcel boundaries unlock on Pro." |
| **Attribution** | Verified source required: Ware County ArcGIS prototype / county GIS / paid parcel vendor |
| **Color** | `#ef4444` / opacity 0.9 |
| **Implementation Status** | ⚠️ Partial (Ware County ArcGIS prototype connected; statewide coverage pending) |

**Performance Notes:** ArcGIS REST responses must be bbox-filtered per viewport. Only request parcels within current map bounds. Use pagination (`resultOffset`, `resultRecordCount`) for large responses.

**Fallback:** If ArcGIS service is unreachable, the layer toggle shows the locked attribution note. Do not crash the map.

---

### 5. FEMA Flood Zones

| Field | Value |
|---|---|
| **Layer ID** | `fema-flood` |
| **Layer Name** | FEMA Flood Zones |
| **Type** | `flood` |
| **Geometry** | Polygon |
| **Endpoint Type** | `arcgis_rest` |
| **Data Sources** | FEMA National Flood Hazard Layer (NFHL) |
| **Data URL** | `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer` |
| **Update Frequency** | Updated by FEMA per county FIRM amendment schedule (can be months to years) |
| **Access Tier** | `dashboard_pro` ($79/mo) |
| **Enabled by Default** | ❌ No |
| **Locked Description** | "Flood overlays unlock on Pro." |
| **Attribution** | FEMA NFHL |
| **Color** | `#38bdf8` / opacity 0.35 |
| **Implementation Status** | ✅ Implemented (config wired with live URL) |

**Performance Notes:** FEMA NFHL is a tile-served MapServer. Load as WMS tile layer for performance — do not try to load GeoJSON for all flood zones. Bbox filter is implicit via tile pyramid.

**Fallback:** If FEMA service is down (maintenance windows are common), show a user-visible warning: "Flood zone data temporarily unavailable."

---

### 6. Zoning Overlays

| Field | Value |
|---|---|
| **Layer ID** | `zoning` |
| **Layer Name** | Zoning Overlays |
| **Type** | `zoning` |
| **Geometry** | Polygon |
| **Endpoint Type** | `arcgis_rest` |
| **Data Sources** | County/municipal GIS portals; Ware County ArcGIS prototype; future: paid zoning data vendor |
| **Update Frequency** | Varies (annually or when jurisdictions rezone) |
| **Access Tier** | `dashboard_pro` ($79/mo) |
| **Enabled by Default** | ❌ No |
| **Locked Description** | "Zoning overlays unlock on Pro." |
| **Attribution** | Verified jurisdiction GIS required |
| **Color** | `#ec4899` / opacity 0.35 |
| **Implementation Status** | ⚠️ Partial (Ware County ArcGIS prototype; statewide coverage not yet available) |

**Performance Notes:** Fetch per-viewport (bbox filter required). Zoning polygons can be highly complex; simplify geometries server-side if possible.

**Fallback:** Layer silently skipped if source unreachable. Attribution note displayed to user.

---

### 7. Off-Market Candidates

| Field | Value |
|---|---|
| **Layer ID** | `off-market-candidates` |
| **Layer Name** | Off-Market Candidates |
| **Type** | `off_market` |
| **Geometry** | Point |
| **Endpoint Type** | `static` |
| **Data Sources** | Internal scoring pipeline — derived from parcel tax, ownership, and source signals |
| **Update Frequency** | Manual batch (pipeline-driven; target monthly) |
| **Access Tier** | `dashboard_investor` ($149/mo) |
| **Enabled by Default** | ❌ No |
| **Locked Description** | "Off-market candidates unlock on Investor." |
| **Attribution** | Generated from parcel/tax/source signals |
| **Color** | `#f97316` |
| **Implementation Status** | 📋 Planned (config wired; scoring model in `offMarketScoring.ts`; no live data feed yet) |

**Performance Notes:** Keep dataset small — surface only high-confidence candidates (score ≥ 60). Load as in-memory static list, same pattern as property pins.

**Fallback:** If no off-market candidates exist in the loaded dataset, layer renders zero points silently.

---

### 8. Opportunity Zones

| Field | Value |
|---|---|
| **Layer ID** | `opportunity-zones` |
| **Layer Name** | Opportunity Zones |
| **Type** | `opportunity_zone` |
| **Geometry** | Polygon |
| **Endpoint Type** | `geojson` |
| **Data Sources** | CDFI Fund / US Treasury Opportunity Zone census tracts GeoJSON |
| **Data URL (planned)** | `https://www.cdfifund.gov/opportunity-zones` (static GeoJSON download) |
| **Update Frequency** | Rare — OZ designations are set for 10-year terms; updates only if new designations are made |
| **Access Tier** | `dashboard_investor` ($149/mo) |
| **Enabled by Default** | ❌ No |
| **Locked Description** | "Opportunity Zone overlays unlock on Investor." |
| **Attribution** | CDFI Fund / US Treasury Opportunity Zones |
| **Color** | `#eab308` / opacity 0.35 |
| **Implementation Status** | 📋 Planned (config added; GeoJSON not yet integrated) |

**Performance Notes:** OZ boundaries are census-tract polygons. Georgia has ~260 OZ tracts. Fetch the full GeoJSON once and cache it — the dataset is ~500 KB for Georgia only. Filter nationally to GA FIPS code 13 before delivery.

**Fallback:** Layer silently disabled if GeoJSON fetch fails. Show a toast: "Opportunity Zone data temporarily unavailable."

---

### 9. Land Bank Properties

| Field | Value |
|---|---|
| **Layer ID** | `land-bank-properties` |
| **Layer Name** | Land Bank Properties |
| **Type** | `land_bank` |
| **Geometry** | Point |
| **Endpoint Type** | `static` |
| **Data Sources** | Georgia land bank sources (Atlanta Land Bank Authority, MARTA Land Bank, county land banks) |
| **Update Frequency** | Manual batch (scraped/sourced quarterly) |
| **Access Tier** | `dashboard_starter` ($39/mo) |
| **Enabled by Default** | ❌ No |
| **Locked Description** | "Land bank layer unlocks on Starter." |
| **Attribution** | Georgia land bank sources |
| **Color** | `#8b5cf6` |
| **Implementation Status** | 📋 Planned (config added; feed not yet connected; land bank data partially in CSV via `Land_Bank_Status` field) |

**Performance Notes:** Land bank inventories are typically small (<500 parcels per authority). Load as static in-memory points filtered from the main CSV or a supplemental static JSON.

**Fallback:** If no land bank points are in the dataset, layer renders zero markers — no error shown.

---

### 10. Tax Sale Properties

| Field | Value |
|---|---|
| **Layer ID** | `tax-sale-properties` |
| **Layer Name** | Tax Sale Properties |
| **Type** | `tax_sale` |
| **Geometry** | Point |
| **Endpoint Type** | `static` |
| **Data Sources** | Georgia county tax commissioner offices and sheriff sale auction lists |
| **Update Frequency** | Monthly (tax sales are scheduled monthly in most counties) |
| **Access Tier** | `dashboard_starter` ($39/mo) |
| **Enabled by Default** | ❌ No |
| **Locked Description** | "Tax sale layer unlocks on Starter." |
| **Attribution** | Georgia county tax commissioner sources |
| **Color** | `#f59e0b` |
| **Implementation Status** | 📋 Planned (config added; feed not yet connected; tax sale data partially in CSV via `Tax_Sale_Status` field) |

**Performance Notes:** Tax sale lists can grow large during active auction cycles. Paginate if >1,000 records. Recommend filtering to upcoming sales (≤90 days) by default.

**Fallback:** If no tax sale points are in the dataset, layer renders zero markers — no error shown.

---

## Access Level Summary

| Layer | Free | Starter ($39) | Pro ($79) | Investor ($149) |
|---|:---:|:---:|:---:|:---:|
| Property Pins | ✅ | ✅ | ✅ | ✅ |
| County Lines | ❌ | ✅ | ✅ | ✅ |
| City Lines | ❌ | ✅ | ✅ | ✅ |
| Land Bank Properties | ❌ | ✅ | ✅ | ✅ |
| Tax Sale Properties | ❌ | ✅ | ✅ | ✅ |
| Parcel Boundaries | ❌ | ❌ | ✅ | ✅ |
| FEMA Flood Zones | ❌ | ❌ | ✅ | ✅ |
| Zoning Overlays | ❌ | ❌ | ✅ | ✅ |
| Off-Market Candidates | ❌ | ❌ | ❌ | ✅ |
| Opportunity Zones | ❌ | ❌ | ❌ | ✅ |

---

## Endpoint Type Reference

| Type | Description |
|---|---|
| `static` | Data loaded from in-memory CSV/JSON; no external HTTP call at layer-toggle time |
| `geojson` | GeoJSON fetched from a remote URL on layer enable; cached after first fetch |
| `arcgis_rest` | ArcGIS REST feature service; must be bbox-filtered per viewport; pagination required |
| `wms` | OGC Web Map Service tile layer; performance-efficient tile pyramid |
| `manual_portal` | Data must be manually exported from county portal; not auto-integrated |

---

## Implementation Roadmap

```
Phase 1 (Current): Property Pins, County Lines, City Lines, FEMA Flood (URLs wired)
Phase 2 (Next):    Land Bank + Tax Sale static feeds connected from CSV
Phase 3 (Q3):      Opportunity Zones GeoJSON integration
Phase 4 (Q4):      Parcel Boundaries statewide via vendor (Regrid/CoreLogic)
Phase 5 (Future):  Off-Market Candidates live scoring feed; Zoning statewide
```

---

## Notes on `canAccessGisLayer()`

The `canAccessGisLayer()` function in `src/lib/gisLayers.ts` maps each layer `type` to the appropriate feature gate from `featureGates.ts`:

| Gate Function | Levels Allowed |
|---|---|
| `canViewCountyCityBoundaries` | `dashboard_starter`, `dashboard_pro`, `dashboard_investor`, `admin` |
| `canViewParcelBoundaries` | `dashboard_pro`, `dashboard_investor`, `admin` |
| `canViewAdvancedGisLayers` | `dashboard_pro`, `dashboard_investor`, `admin` |
| `canViewOffMarketLeads` | `dashboard_investor`, `admin` |

`land_bank` and `tax_sale` types use `canViewCountyCityBoundaries` (unlocks at Starter).  
`opportunity_zone` uses `canViewAdvancedGisLayers` (unlocks at Pro — but the layer `minAccessLevel` is set to `dashboard_investor`; the switch gate is the effective gate).

> **Note:** For `opportunity_zone`, both the config `minAccessLevel` (`dashboard_investor`) and the switch case (`canViewAdvancedGisLayers`, which allows Pro+) need to be consistent. Currently the config is more restrictive; the config `minAccessLevel` governs UI lock display while the switch governs runtime access. Keep these in sync.
