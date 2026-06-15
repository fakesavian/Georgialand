/**
 * @file sourceRegistry.ts
 * @description Central registry of all Georgia Land Finder data sources.
 *
 * This file is the single source of truth for:
 * - All county GIS endpoints (ArcGIS FeatureServer / MapServer)
 * - Tax assessor / qPublic portal URLs
 * - Listing feed sources
 * - Connector implementation status and confidence scores
 *
 * Callers should import `SOURCE_REGISTRY` or use the factory helpers
 * (`getConnectorForCounty`, `getSourcesByTier`) rather than hard-coding
 * endpoint URLs in application code.
 *
 * @see docs/GEORGIA_COUNTY_GIS_SOURCE_MAP.md for full research notes
 * @see docs/DATA_CONNECTOR_ARCHITECTURE.md for architecture overview
 */

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/**
 * ArcGIS service type.
 * - `FeatureServer` – supports geometry queries and editing
 * - `MapServer`     – read-only; geometry available via query
 */
export type ArcGisServiceType = 'FeatureServer' | 'MapServer';

/**
 * Access method classification for a data source.
 */
export type AccessType =
  | 'ArcGIS-FS'       // ArcGIS FeatureServer – live REST query
  | 'ArcGIS-MS'       // ArcGIS MapServer – live REST query (read-only)
  | 'ArcGIS-Hub'      // ArcGIS Open Data Hub – portal, direct URL needs verification
  | 'qPublic'         // Tyler Technologies qPublic HTML scrape
  | 'Custom-Portal'   // County-maintained non-ArcGIS portal
  | 'Download-Only';  // Bulk shapefile/GeoJSON download only

/**
 * Implementation status of the connector for a given source.
 */
export type ConnectorStatus =
  | 'verified'      // Live endpoint confirmed; connector implemented
  | 'researched'    // URL researched; connector stub ready; needs field verification
  | 'portal_only'   // Portal exists; no direct REST URL confirmed
  | 'pending';      // No confirmed endpoint found

/**
 * Data tier classification.
 * - `1` – Metro Atlanta core counties (highest priority)
 * - `2` – Regional urban centers
 * - `3` – Rural / statewide (future expansion)
 */
export type DataTier = 1 | 2 | 3;

/**
 * Source confidence score (0–100).
 * 90–100: Verified live REST query from official county GIS
 * 70–89:  Verified qPublic/assessor authoritative data
 * 50–69:  Third-party aggregator
 * 30–49:  Inferred/scraped, unverified
 * 0–29:   Placeholder / unknown
 */
export type SourceConfidenceScore = number;

/**
 * ArcGIS source configuration used by the arcgisRestConnector.
 */
export interface ArcGisSourceConfig {
  /** Full ArcGIS REST service URL including layer ID, e.g. `.../FeatureServer/0` */
  serviceUrl: string;
  /** Service type (FeatureServer or MapServer) */
  serviceType: ArcGisServiceType;
  /** Layer index within the service */
  layerId: number;
  /** Comma-separated list of field names to retrieve */
  outFields: string;
  /** The field name containing the parcel ID in this source */
  parcelIdField: string;
  /** Maximum records per query */
  resultRecordCount?: number;
  /** Whether token-based authentication is required */
  requiresAuth?: boolean;
}

/**
 * Full registry entry for a single Georgia county or regional data source.
 */
export interface SourceRegistryEntry {
  /** Unique source identifier, e.g. `fulton_county_arcgis` */
  sourceId: string;
  /** Human-readable source name */
  sourceName: string;
  /** County name (lowercase, matches `LandProperty.County`) */
  county: string;
  /** Georgia state abbreviation */
  state: 'GA';
  /** Data tier (1 = Metro Atlanta, 2 = Regional) */
  tier: DataTier;
  /** County seat city */
  seatCity: string;
  /** Primary access method */
  accessType: AccessType;
  /** GIS portal URL (human-facing) */
  gisPortalUrl: string;
  /** ArcGIS configuration (present when accessType is ArcGIS-FS or ArcGIS-MS) */
  arcgisConfig?: ArcGisSourceConfig;
  /** Tax assessor / qPublic URL */
  taxAssessorUrl: string;
  /** qPublic search URL */
  qPublicUrl?: string;
  /** How often the source is refreshed */
  updateCadence: string;
  /** Connector implementation status */
  connectorStatus: ConnectorStatus;
  /** Baseline source confidence score */
  baseConfidence: SourceConfidenceScore;
  /** Additional notes about this source */
  notes: string;
  /**
   * Whether this source is a placeholder that needs field verification.
   * Connectors should skip or warn when placeholder is true.
   */
  isPlaceholder: boolean;
}

// ---------------------------------------------------------------------------
// Source Registry
// ---------------------------------------------------------------------------

/**
 * Master list of all Georgia county GIS data sources.
 *
 * Sources with `isPlaceholder: true` have researched but unconfirmed REST URLs.
 * The `arcgisConfig.serviceUrl` for these sources contains `PLACEHOLDER` in the
 * path and must be replaced with a verified URL before production use.
 *
 * @see docs/GEORGIA_COUNTY_GIS_SOURCE_MAP.md
 */
export const SOURCE_REGISTRY: SourceRegistryEntry[] = [
  // -------------------------------------------------------------------------
  // TIER 1: Metro Atlanta Counties
  // -------------------------------------------------------------------------

  {
    sourceId: 'fulton_county_arcgis',
    sourceName: 'Fulton County GIS Tax Parcels',
    county: 'fulton',
    state: 'GA',
    tier: 1,
    seatCity: 'Atlanta',
    accessType: 'ArcGIS-FS',
    gisPortalUrl: 'https://arcgis.com',
    arcgisConfig: {
      serviceUrl: 'https://services1.arcgis.com/AQDHTHDrZzfsFsB5/arcgis/rest/services/Tax_Parcels/FeatureServer/0',
      serviceType: 'FeatureServer',
      layerId: 0,
      outFields: 'OBJECTID,ParcelID,TaxYear,Address,Owner,LandAcres,ClassCode,LUCode',
      parcelIdField: 'ParcelID',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.fultoncountyga.gov/services/find-my-tax-account',
    qPublicUrl: 'https://qpublic.net/ga/fulton/',
    updateCadence: 'Annual (tax year)',
    connectorStatus: 'verified',
    baseConfidence: 92,
    notes: 'Confirmed live in wareCountyGisConnector.ts. 12-char trailing parcel ID match strategy.',
    isPlaceholder: false,
  },

  {
    sourceId: 'dekalb_county_arcgis',
    sourceName: 'DeKalb County GIS Tax Parcels 2025',
    county: 'dekalb',
    state: 'GA',
    tier: 1,
    seatCity: 'Decatur',
    accessType: 'ArcGIS-FS',
    gisPortalUrl: 'https://www.dekalbcountyga.gov/planning-sustainability/gis',
    arcgisConfig: {
      serviceUrl: 'https://services2.arcgis.com/IxVN2oUE9EYLSnPE/arcgis/rest/services/Tax_Parcels_2025/FeatureServer/0',
      serviceType: 'FeatureServer',
      layerId: 0,
      outFields: 'OBJECTID,ParcelID,StatedArea,StatedAreaUnit,CalculatedArea,ZONING,LANDUSE,TAXYR,STATUS,PROPERTY_CLASS,LAND_VALUE,APPRAISED_VALUE',
      parcelIdField: 'ParcelID',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.dekalbcountyga.gov/tax-assessor/tax-assessors-office',
    qPublicUrl: 'https://qpublic.net/ga/dekalb/',
    updateCadence: 'Annual',
    connectorStatus: 'verified',
    baseConfidence: 92,
    notes: 'Confirmed live in wareCountyGisConnector.ts. Exact parcel ID normalization match.',
    isPlaceholder: false,
  },

  {
    sourceId: 'clayton_county_arcgis',
    sourceName: 'Clayton County Tax Assessor Parcels',
    county: 'clayton',
    state: 'GA',
    tier: 1,
    seatCity: 'Jonesboro',
    accessType: 'ArcGIS-MS',
    gisPortalUrl: 'https://claytoncountyga-clayton.hub.arcgis.com/',
    arcgisConfig: {
      serviceUrl: 'https://weba.co.clayton.ga.us:5443/server/rest/services/TaxAssessor/Parcels/MapServer/0',
      serviceType: 'MapServer',
      layerId: 0,
      outFields: '*',
      parcelIdField: 'PARID',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.claytoncountyga.gov/government/departments-a-f/board-of-tax-assessors',
    qPublicUrl: 'https://qpublic.net/ga/clayton/',
    updateCadence: 'Annual',
    connectorStatus: 'researched',
    baseConfidence: 70,
    notes: 'Official Clayton County Parcels MapServer discovered at county host; timed out from research runtime on port 5443, so verify layer fields before attaching boundaries.',
    isPlaceholder: false,
  },

  {
    sourceId: 'cobb_county_arcgis',
    sourceName: 'Cobb County GIS Tax Assessors Parcels',
    county: 'cobb',
    state: 'GA',
    tier: 1,
    seatCity: 'Marietta',
    accessType: 'ArcGIS-MS',
    gisPortalUrl: 'https://cobbcounty.org/gis',
    arcgisConfig: {
      serviceUrl: 'https://gis.cobbcounty.org/gisserver/rest/services/tax/taxassessorsdaily/MapServer/0',
      serviceType: 'MapServer',
      layerId: 0,
      outFields: 'OBJECTID,PIN,PARID,OWNER_NAM1,OWNER_NAM2,SITUS_ADDR,ACRES,FMV_LAND,FMV_BLDG,FMV_TOTAL,ASV_LAND,ASV_BLDG,ASV_TOTAL,CLASS',
      parcelIdField: 'PIN',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.cobbtaxassessor.org',
    updateCadence: 'Nightly (CAMA-linked)',
    connectorStatus: 'researched',
    baseConfidence: 88,
    notes: 'Likely official Cobb County tax assessors daily MapServer at .org host; timed out from research runtime, so require health check before attaching boundaries.',
    isPlaceholder: false,
  },

  {
    sourceId: 'gwinnett_county_arcgis',
    sourceName: 'Gwinnett County GIS Land Parcels',
    county: 'gwinnett',
    state: 'GA',
    tier: 1,
    seatCity: 'Lawrenceville',
    accessType: 'ArcGIS-FS',
    gisPortalUrl: 'https://gcgis-gwinnettcountyga.hub.arcgis.com/',
    arcgisConfig: {
      serviceUrl: 'https://services3.arcgis.com/RfpmnkSAQleRbndX/arcgis/rest/services/Property_and_Tax/FeatureServer/0',
      serviceType: 'FeatureServer',
      layerId: 0,
      outFields: 'OBJECTID,PIN,TAXPIN,ADDRESS,LOT,PARCELTYPE,DEEDEDACREAGE,ACREAGE_TEXT,CALCULATEDACREAGE,LRSN',
      parcelIdField: 'PIN',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.gwinnettcounty.com/web/gwinnett/departments/taxassessors',
    qPublicUrl: 'https://qpublic.net/ga/gwinnett/',
    updateCadence: 'Frequent',
    connectorStatus: 'verified',
    baseConfidence: 92,
    notes: 'Official GwinnettCountyGIS Land Parcels FeatureServer. Geometry verified via /query returnGeometry=true; use PIN primary, TAXPIN secondary if added.',
    isPlaceholder: false,
  },

  {
    sourceId: 'douglas_county_arcgis',
    sourceName: 'Douglas County GA GIS Parcels',
    county: 'douglas',
    state: 'GA',
    tier: 1,
    seatCity: 'Douglasville',
    accessType: 'ArcGIS-Hub',
    gisPortalUrl: 'https://www.celebratedouglascountyga.gov/270/Geographic-Information-Systems-GIS',
    arcgisConfig: {
      // TODO: Replace PLACEHOLDER. Retrieve via county GIS Data Requests page
      // URL: https://www.celebratedouglascountyga.gov/270/Geographic-Information-Systems-GIS
      serviceUrl: 'https://services.arcgis.com/PLACEHOLDER/arcgis/rest/services/Douglas_GA_Parcels/FeatureServer/0',
      serviceType: 'FeatureServer',
      layerId: 0,
      outFields: 'OBJECTID,PARID,OWNER,SITEADDR,ACRES',
      parcelIdField: 'PARID',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.celebratedouglascountyga.gov',
    qPublicUrl: 'https://qpublic.net/ga/douglas/',
    updateCadence: 'Annual',
    connectorStatus: 'researched',
    baseConfidence: 65,
    notes: 'County GIS page confirmed (Douglas County GA, not CO or OR). Exact URL via Data Requests.',
    isPlaceholder: true,
  },

  {
    sourceId: 'henry_county_arcgis',
    sourceName: 'Henry County GA GIS Parcels',
    county: 'henry',
    state: 'GA',
    tier: 1,
    seatCity: 'McDonough',
    accessType: 'ArcGIS-MS',
    gisPortalUrl: 'https://henrycountyga.hub.arcgis.com/',
    arcgisConfig: {
      // TODO: Verify exact layer URL via henrycountyga.hub.arcgis.com → search "HenryParcels"
      serviceUrl: 'https://gis.henrycounty-ga.gov/arcgis/rest/services/Parcels/MapServer/0',
      serviceType: 'MapServer',
      layerId: 0,
      outFields: 'OBJECTID,PARID,OWNER,SITEADDR,ACRES,APPRAISED',
      parcelIdField: 'PARID',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.henrycountyga.gov/government/departments/tax-assessor',
    qPublicUrl: 'https://qpublic.net/ga/henry/',
    updateCadence: 'Annual',
    connectorStatus: 'researched',
    baseConfidence: 78,
    notes: 'Hub + REST directory at gis.henrycounty-ga.gov confirmed. Specific layer from hub.',
    isPlaceholder: true,
  },

  {
    sourceId: 'rockdale_county_arcgis',
    sourceName: 'Rockdale County GIS Parcels',
    county: 'rockdale',
    state: 'GA',
    tier: 1,
    seatCity: 'Conyers',
    accessType: 'ArcGIS-Hub',
    gisPortalUrl: 'https://rockdale-county-gis-data-hub-rockdalecountyga.hub.arcgis.com/',
    arcgisConfig: {
      // TODO: Navigate hub → "Rockdale County Parcels" → API to get URL
      serviceUrl: 'https://services.arcgis.com/PLACEHOLDER/arcgis/rest/services/Rockdale_Parcels/FeatureServer/0',
      serviceType: 'FeatureServer',
      layerId: 0,
      outFields: 'OBJECTID,PARID,OWNER,SITEADDR,ACRES',
      parcelIdField: 'PARID',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.rockdalecountyga.gov/departments/tax-assessor/',
    qPublicUrl: 'https://qpublic.net/ga/rockdale/',
    updateCadence: 'Annual',
    connectorStatus: 'researched',
    baseConfidence: 68,
    notes: 'Hub confirmed. "Rockdale County Parcels" Feature Service indexed in hub.',
    isPlaceholder: true,
  },

  {
    sourceId: 'fayette_county_qpublic',
    sourceName: 'Fayette County Tax Assessor / CAD',
    county: 'fayette',
    state: 'GA',
    tier: 1,
    seatCity: 'Fayetteville',
    accessType: 'Download-Only',
    gisPortalUrl: 'https://fayettecountyga.gov',
    taxAssessorUrl: 'https://fayettecad.org',
    qPublicUrl: 'https://qpublic.net/ga/fayette/',
    updateCadence: 'Annual',
    connectorStatus: 'portal_only',
    baseConfidence: 55,
    notes: 'No confirmed public FeatureServer REST API. Shapefile download only via fayettecad.org. Fall back to qPublic for tax card data.',
    isPlaceholder: true,
  },

  {
    sourceId: 'cherokee_county_arcgis',
    sourceName: 'Cherokee County GIS Parcels',
    county: 'cherokee',
    state: 'GA',
    tier: 1,
    seatCity: 'Canton',
    accessType: 'ArcGIS-MS',
    gisPortalUrl: 'https://cherokeecountyga.gov',
    arcgisConfig: {
      serviceUrl: 'https://gis.cherokeega.com/arcgis/rest/services/MainLayers/MapServer/1',
      serviceType: 'MapServer',
      layerId: 1,
      outFields: 'OBJECTID,PARID,OWNER,SITEADDR,ACRES',
      parcelIdField: 'PARID',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.cherokeecountyga.gov/taxassessor',
    qPublicUrl: 'https://qpublic.net/ga/cherokee/',
    updateCadence: 'Annual',
    connectorStatus: 'researched',
    baseConfidence: 80,
    notes: 'MapServer confirmed at gis.cherokeega.com/arcgis/rest/services/MainLayers/MapServer/1. Parcel edits by Tax Assessor since 2015.',
    isPlaceholder: false,
  },

  {
    sourceId: 'forsyth_county_arcgis',
    sourceName: 'Forsyth County GIS Tax Parcels',
    county: 'forsyth',
    state: 'GA',
    tier: 1,
    seatCity: 'Cumming',
    accessType: 'ArcGIS-FS',
    gisPortalUrl: 'https://data-forsythco.opendata.arcgis.com/',
    arcgisConfig: {
      serviceUrl: 'https://maps.forsythco.com/arcgis/rest/services/Public/Tax_Parcel/FeatureServer/0',
      serviceType: 'FeatureServer',
      layerId: 0,
      outFields: 'OBJECTID,PARID,OWNER,SITEADDR,ACRES,APPRAISED,TAXYR',
      parcelIdField: 'PARID',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.forsythco.com/Departments/BoardofAssessors',
    qPublicUrl: 'https://qpublic.net/ga/forsyth/',
    updateCadence: 'Regular',
    connectorStatus: 'researched',
    baseConfidence: 85,
    notes: 'FeatureServer URL confirmed at maps.forsythco.com. Open data portal at data-forsythco.opendata.arcgis.com.',
    isPlaceholder: false,
  },

  // -------------------------------------------------------------------------
  // TIER 2: Regional Urban Centers
  // -------------------------------------------------------------------------

  {
    sourceId: 'richmond_county_arcgis',
    sourceName: 'Augusta-Richmond County GIS Parcels',
    county: 'richmond',
    state: 'GA',
    tier: 2,
    seatCity: 'Augusta',
    accessType: 'ArcGIS-Hub',
    gisPortalUrl: 'https://geohub-augustaga.hub.arcgis.com/',
    arcgisConfig: {
      // TODO: Retrieve via GeoHub: geohub-augustaga.hub.arcgis.com → Parcels → "View Data Source"
      serviceUrl: 'https://services.arcgis.com/PLACEHOLDER/arcgis/rest/services/Augusta_Parcels/FeatureServer/0',
      serviceType: 'FeatureServer',
      layerId: 0,
      outFields: 'OBJECTID,PARID,OWNER,SITEADDR,ACRES,APPRAISED',
      parcelIdField: 'PARID',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.augustaga.gov/188/Board-of-Assessors',
    qPublicUrl: 'https://qpublic.net/ga/richmond/',
    updateCadence: 'Annual',
    connectorStatus: 'researched',
    baseConfidence: 68,
    notes: 'GeoHub confirmed at geohub-augustaga.hub.arcgis.com. Retrieve FeatureServer URL via hub portal.',
    isPlaceholder: true,
  },

  {
    sourceId: 'bibb_county_arcgis',
    sourceName: 'Macon-Bibb County GIS Parcels',
    county: 'bibb',
    state: 'GA',
    tier: 2,
    seatCity: 'Macon',
    accessType: 'ArcGIS-Hub',
    gisPortalUrl: 'https://maconinsights.com',
    arcgisConfig: {
      // TODO: Navigate maconinsights.com → search "Tax Parcels" → click API for REST URL
      serviceUrl: 'https://services.arcgis.com/PLACEHOLDER/arcgis/rest/services/MaconBibb_Parcels/FeatureServer/0',
      serviceType: 'FeatureServer',
      layerId: 0,
      outFields: 'OBJECTID,PARID,OWNER,SITEADDR,ACRES,APPRAISED',
      parcelIdField: 'PARID',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://maconbibb.us/tax-assessors-office/',
    updateCadence: 'Annual',
    connectorStatus: 'researched',
    baseConfidence: 65,
    notes: 'Macon Insights Open Data portal confirmed. Data via Middle Georgia Regional Commission (GMRC).',
    isPlaceholder: true,
  },

  {
    sourceId: 'chatham_county_sagis',
    sourceName: 'Chatham County GIS Parcels (SAGIS)',
    county: 'chatham',
    state: 'GA',
    tier: 2,
    seatCity: 'Savannah',
    accessType: 'ArcGIS-FS',
    gisPortalUrl: 'https://geodata-sagis.hub.arcgis.com/',
    arcgisConfig: {
      // TODO: Search SAGIS hub for "Parcel Digest" → API link for FeatureServer URL
      // SAGIS REST root: https://gis.sagis.org/arcgis/rest/services
      serviceUrl: 'https://gis.sagis.org/arcgis/rest/services/PLACEHOLDER/FeatureServer/0',
      serviceType: 'FeatureServer',
      layerId: 0,
      outFields: 'OBJECTID,PIN,OWNER,ADDRESS,ACRES,APPRAISED',
      parcelIdField: 'PIN',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.chathamcounty.org/538/Board-of-Assessors',
    qPublicUrl: 'https://qpublic.net/ga/chatham/',
    updateCadence: 'Annual (Digest)',
    connectorStatus: 'researched',
    baseConfidence: 75,
    notes: 'SAGIS (Savannah Area GIS) is multi-jurisdictional authority. REST root at gis.sagis.org confirmed.',
    isPlaceholder: true,
  },

  {
    sourceId: 'athens_clarke_arcgis',
    sourceName: 'Athens-Clarke County GIS Parcels',
    county: 'clarke',
    state: 'GA',
    tier: 2,
    seatCity: 'Athens',
    accessType: 'ArcGIS-FS',
    gisPortalUrl: 'https://data.accgov.com/',
    arcgisConfig: {
      serviceUrl: 'https://services.arcgis.com/uU67H6v3g22H29D3/ArcGIS/rest/services/ACC_PARCELS/FeatureServer/0',
      serviceType: 'FeatureServer',
      layerId: 0,
      outFields: 'OBJECTID,PARID,OWNER,SITEADDR,ACRES,APPRAISED,TAXYR',
      parcelIdField: 'PARID',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.accgov.com/187/Tax-Assessor',
    qPublicUrl: 'https://qpublic.net/ga/clarke/',
    updateCadence: 'Annual',
    connectorStatus: 'researched',
    baseConfidence: 82,
    notes: 'FeatureServer confirmed at services.arcgis.com. Layer = gis_arcserver.DBO.parcels (0). Supports Query.',
    isPlaceholder: false,
  },

  {
    sourceId: 'muscogee_county_arcgis',
    sourceName: 'Columbus-Muscogee County GIS Tax Parcels',
    county: 'muscogee',
    state: 'GA',
    tier: 2,
    seatCity: 'Columbus',
    accessType: 'ArcGIS-MS',
    gisPortalUrl: 'https://columbus.gov',
    arcgisConfig: {
      // TODO: Verify parcel layer index. Navigate MapServer root to find Parcels layer ID (likely 20)
      // MapServer root: https://maps.columbusga.org/arcgis/rest/services/TaxAssessors/CurrentYear/MapServer
      serviceUrl: 'https://maps.columbusga.org/arcgis/rest/services/TaxAssessors/CurrentYear/MapServer/20',
      serviceType: 'MapServer',
      layerId: 20,
      outFields: 'OBJECTID,PARID,OWNER,SITEADDR,ACRES,APPRAISED',
      parcelIdField: 'PARID',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.columbusga.org/departments/tax-assessor',
    qPublicUrl: 'https://qpublic.net/ga/muscogee/',
    updateCadence: 'Annual',
    connectorStatus: 'researched',
    baseConfidence: 78,
    notes: 'MapServer confirmed at maps.columbusga.org. Parcels layer index needs verification; navigate MapServer root.',
    isPlaceholder: true,
  },

  {
    sourceId: 'dougherty_county_arcgis',
    sourceName: 'Albany-Dougherty County GIS Parcels',
    county: 'dougherty',
    state: 'GA',
    tier: 2,
    seatCity: 'Albany',
    accessType: 'ArcGIS-Hub',
    gisPortalUrl: 'https://geohub-albanyga.hub.arcgis.com/',
    arcgisConfig: {
      // TODO: Navigate geohub-albanyga.hub.arcgis.com → search "Land Lots" or "Parcels" → API link
      serviceUrl: 'https://services.arcgis.com/PLACEHOLDER/arcgis/rest/services/Albany_Parcels/FeatureServer/0',
      serviceType: 'FeatureServer',
      layerId: 0,
      outFields: 'OBJECTID,PARID,OWNER,SITEADDR,ACRES,APPRAISED',
      parcelIdField: 'PARID',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.doughertycountyga.gov/departments/board-of-tax-assessors',
    qPublicUrl: 'https://qpublic.net/ga/dougherty/',
    updateCadence: 'Annual',
    connectorStatus: 'researched',
    baseConfidence: 65,
    notes: 'Joint Albany-Dougherty GeoHub confirmed at geohub-albanyga.hub.arcgis.com.',
    isPlaceholder: true,
  },

  {
    sourceId: 'lowndes_county_valor',
    sourceName: 'Lowndes County GIS Parcels (VALOR)',
    county: 'lowndes',
    state: 'GA',
    tier: 2,
    seatCity: 'Valdosta',
    accessType: 'ArcGIS-MS',
    gisPortalUrl: 'https://valor-gis.org/',
    arcgisConfig: {
      // TODO: Verify layer index by navigating VALOR MapServer root at valor-gis.org/arcgis/rest/services
      serviceUrl: 'https://valor-gis.org/arcgis/rest/services/Valor/Parcels/MapServer/0',
      serviceType: 'MapServer',
      layerId: 0,
      outFields: 'OBJECTID,PARID,OWNER,SITEADDR,ACRES,APPRAISED',
      parcelIdField: 'PARID',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.lowndes.ga.us/departments/tax-assessors',
    qPublicUrl: 'https://qpublic.net/ga/lowndes/',
    updateCadence: 'Regular',
    connectorStatus: 'researched',
    baseConfidence: 78,
    notes: 'VALOR (Valdosta-Lowndes Regional GIS) multi-jurisdictional system. REST root confirmed at valor-gis.org.',
    isPlaceholder: true,
  },

  {
    sourceId: 'floyd_county_arcgis',
    sourceName: 'Floyd County GIS Current Parcels',
    county: 'floyd',
    state: 'GA',
    tier: 2,
    seatCity: 'Rome',
    accessType: 'ArcGIS-FS',
    gisPortalUrl: 'https://romefloyd.maps.arcgis.com/',
    arcgisConfig: {
      serviceUrl: 'https://services2.arcgis.com/nV67H1IJR8GS6SAA/ArcGIS/rest/services/Current_Parcels/FeatureServer/5',
      serviceType: 'FeatureServer',
      layerId: 5,
      outFields: 'OBJECTID,PARCEL,PARCEL_1,NAME,ADDRESS,PROP_ADDR,TOTALACRES,VALUE2022,VALUE2021,VALUE2020,DESCRIP,TAXDISTRIC,DIGCLASS,DIGSTRAT,REALKEY,OWNKEY',
      parcelIdField: 'PARCEL',
      resultRecordCount: 500,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.romega.us/183/Board-of-Tax-Assessors',
    qPublicUrl: 'https://qpublic.net/ga/floyd/',
    updateCadence: 'Annual / county updates',
    connectorStatus: 'verified',
    baseConfidence: 90,
    notes: 'Verified public Rome/Floyd Current_Parcels FeatureServer layer 5. Service description: most current parcel data for Floyd County; /query supports JSON/geoJSON/PBF and returns parcel polygons.',
    isPlaceholder: false,
  },

  {
    sourceId: 'glynn_county_arcgis',
    sourceName: 'Glynn County GIS Parcels (Brunswick)',
    county: 'glynn',
    state: 'GA',
    tier: 2,
    seatCity: 'Brunswick',
    accessType: 'ArcGIS-FS',
    gisPortalUrl: 'https://gis.glynncounty-ga.gov/',
    arcgisConfig: {
      // TODO: Navigate gis.glynncounty-ga.gov → search "Parcels" Feature Service → get URL
      // REST root: https://gis.glynncounty-ga.gov/arcgis/rest/services
      serviceUrl: 'https://gis.glynncounty-ga.gov/arcgis/rest/services/PLACEHOLDER/FeatureServer/0',
      serviceType: 'FeatureServer',
      layerId: 0,
      outFields: 'OBJECTID,PARID,OWNER,SITEADDR,ACRES,APPRAISED',
      parcelIdField: 'PARID',
      resultRecordCount: 50,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.glynncounty.org/175/Board-of-Assessors',
    qPublicUrl: 'https://qpublic.net/ga/glynn/',
    updateCadence: 'Annual',
    connectorStatus: 'researched',
    baseConfidence: 72,
    notes: 'Open data portal confirmed at gis.glynncounty-ga.gov. REST root confirmed. Navigate portal for Parcels FeatureServer URL.',
    isPlaceholder: true,
  },

  {
    sourceId: 'ware_county_arcgis',
    sourceName: 'Ware County GIS public geodatabase',
    county: 'ware',
    state: 'GA',
    tier: 2,
    seatCity: 'Waycross',
    accessType: 'ArcGIS-FS',
    gisPortalUrl: 'https://services9.arcgis.com/XAyIBOsw3fLfDjTY/arcgis/rest/services/WareCounty_Base_gdb/FeatureServer',
    arcgisConfig: {
      serviceUrl: 'https://services9.arcgis.com/XAyIBOsw3fLfDjTY/arcgis/rest/services/WareCounty_Base_gdb/FeatureServer/38',
      serviceType: 'FeatureServer',
      layerId: 38,
      outFields: 'OBJECTID,PARCEL,PARCEL_NO,MAP,BLOCK_NO,LANDLOT,ACRES,REALKEY,OWNKEY,HOUSE_NO,STREET_NAM',
      parcelIdField: 'PARCEL',
      resultRecordCount: 500,
      requiresAuth: false,
    },
    taxAssessorUrl: 'https://www.warecounty.com/tax-assessors',
    qPublicUrl: 'https://qpublic.net/ga/ware/',
    updateCadence: 'As updated by county',
    connectorStatus: 'verified',
    baseConfidence: 93,
    notes: 'FULLY IMPLEMENTED in src/lib/wareCountyGisConnector.ts. Layers: Parcels (38), Zoning (25), LotLines (18). Extent-based query.',
    isPlaceholder: false,
  },
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Look up a registry entry by county name (case-insensitive).
 *
 * @param county - County name as stored in `LandProperty.County`
 * @returns The matching `SourceRegistryEntry` or `undefined` if not found
 *
 * @example
 * const entry = getEntryForCounty('Fulton');
 */
export function getEntryForCounty(county: string): SourceRegistryEntry | undefined {
  const normalized = county.trim().toLowerCase();
  return SOURCE_REGISTRY.find((entry) => entry.county === normalized);
}

/**
 * Returns all source entries for a given data tier.
 *
 * @param tier - Data tier (1 = Metro Atlanta, 2 = Regional, 3 = Rural/statewide)
 */
export function getSourcesByTier(tier: DataTier): SourceRegistryEntry[] {
  return SOURCE_REGISTRY.filter((entry) => entry.tier === tier);
}

/**
 * Returns all source entries with a given connector status.
 *
 * @param status - Connector status to filter by
 */
export function getSourcesByStatus(status: ConnectorStatus): SourceRegistryEntry[] {
  return SOURCE_REGISTRY.filter((entry) => entry.connectorStatus === status);
}

/**
 * Returns all source entries that have a non-placeholder ArcGIS config
 * (i.e., a confirmed, queryable REST endpoint).
 */
export function getQueryableSources(): SourceRegistryEntry[] {
  return SOURCE_REGISTRY.filter(
    (entry) => entry.arcgisConfig !== undefined && !entry.isPlaceholder
  );
}

/**
 * Checks if a source entry has a confirmed (non-placeholder) ArcGIS REST URL.
 *
 * @param entry - The registry entry to check
 */
export function isSourceQueryable(entry: SourceRegistryEntry): boolean {
  return entry.arcgisConfig !== undefined && !entry.isPlaceholder;
}

/**
 * Returns a summary of all source statuses for dashboard display.
 */
export function getSourceStatusSummary(): {
  verified: number;
  researched: number;
  portalOnly: number;
  pending: number;
  total: number;
} {
  const counts = SOURCE_REGISTRY.reduce(
    (acc, entry) => {
      if (entry.connectorStatus === 'verified') acc.verified += 1;
      else if (entry.connectorStatus === 'researched') acc.researched += 1;
      else if (entry.connectorStatus === 'portal_only') acc.portalOnly += 1;
      else acc.pending += 1;
      return acc;
    },
    { verified: 0, researched: 0, portalOnly: 0, pending: 0, total: SOURCE_REGISTRY.length }
  );
  return counts;
}
