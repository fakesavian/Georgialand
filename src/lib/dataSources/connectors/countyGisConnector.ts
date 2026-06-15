/**
 * @file countyGisConnector.ts
 * @description High-level county GIS router that dispatches to the ArcGIS REST engine.
 *
 * This connector:
 * 1. Accepts county names and `LandProperty` arrays as input
 * 2. Looks up the correct source config from `sourceRegistry.ts`
 * 3. Delegates to `arcgisRestConnector.ts` for the actual HTTP fetch
 * 4. Applies county-specific field mappings to produce `NormalizedProperty` records
 * 5. Returns structured results with confidence scores and status information
 *
 * Design follows the pattern established in `src/lib/wareCountyGisConnector.ts`,
 * extended to support all 21 researched Georgia counties.
 *
 * @see src/lib/wareCountyGisConnector.ts  — reference implementation
 * @see src/lib/dataSources/sourceRegistry.ts — source configurations
 * @see src/lib/dataSources/connectors/arcgisRestConnector.ts — ArcGIS engine
 */

import type { LandProperty } from '../../../types';
import {
  SOURCE_REGISTRY,
  getEntryForCounty,
  isSourceQueryable,
  type SourceRegistryEntry,
} from '../sourceRegistry';
import {
  queryByExtent,
  queryByParcelId,
  queryByPointEnvelope,
  queryByWhereClause,
  buildBBoxFromCoords,
  normalizeParcelId,
  type ArcGisFeature,
  type ArcGisConnectorResult,
  type BBox,
} from './arcgisRestConnector';

// ---------------------------------------------------------------------------
// Normalized property interface
// ---------------------------------------------------------------------------

/**
 * Normalized property record produced by the county GIS connector.
 * Provides a uniform shape regardless of source county or access type.
 */
export interface NormalizedProperty {
  /** Normalized parcel ID (uppercase, alphanumeric only) */
  parcelId: string;
  /** Original parcel ID exactly as returned by the source */
  rawParcelId: string;
  /** County name (lowercase) */
  county: string;
  /** State abbreviation */
  state: 'GA';
  /** Full site address */
  address: string;
  /** Owner name(s) */
  owner?: string;
  /** Lot size in acres */
  acreage?: number;
  /** Appraised value in USD */
  appraisedValue?: number;
  /** Assessed value in USD */
  assessedValue?: number;
  /** Tax year of the assessment */
  taxYear?: number;
  /** Zoning code */
  zoning?: string;
  /** Land use code */
  landUse?: string;
  /** Latitude (WGS84) */
  latitude?: number;
  /** Longitude (WGS84) */
  longitude?: number;
  /** Polygon rings in [lat, lon] order */
  rings?: [number, number][][];
  /** Polyline paths in [lat, lon] order */
  paths?: [number, number][][];
  /** Source ID from registry */
  sourceId: string;
  /** Source display name */
  sourceName: string;
  /** URL used to retrieve this record */
  sourceUrl: string;
  /** Data confidence score (0–100) */
  sourceConfidence: number;
  /** ISO 8601 timestamp of fetch */
  fetchedAt: string;
  /** Attribution string for map display */
  attribution: string;
  /** Raw attribute dictionary from ArcGIS response */
  rawAttributes: Record<string, unknown>;
}

/**
 * Connector result wrapper with metadata and error collection.
 */
export interface CountyGisConnectorResult {
  properties: NormalizedProperty[];
  sourceId: string;
  sourceName: string;
  county: string;
  fetchedAt: string;
  recordCount: number;
  confidence: number;
  errors: string[];
  /** Whether the source has a placeholder URL (needs field verification) */
  isPlaceholder: boolean;
}

/**
 * Status of a county GIS connector for dashboard display.
 */
export interface CountyConnectorStatus {
  county: string;
  sourceId: string;
  sourceName: string;
  connectorStatus: SourceRegistryEntry['connectorStatus'];
  accessType: SourceRegistryEntry['accessType'];
  isPlaceholder: boolean;
  gisPortalUrl: string;
  taxAssessorUrl: string;
  qPublicUrl?: string;
  baseConfidence: number;
  notes: string;
}

// ---------------------------------------------------------------------------
// County-specific field mappings
// ---------------------------------------------------------------------------

/**
 * Maps county-specific attribute field names to the normalized property interface.
 * Add new counties here as their FeatureServer URLs are verified.
 *
 * Format: `{ [countySlug]: { parcelId: fieldName, owner: fieldName, ... } }`
 */
const COUNTY_FIELD_MAPS: Record<
  string,
  Partial<{
    parcelId: string;
    owner: string;
    address: string;
    acreage: string;
    appraised: string;
    assessed: string;
    taxYear: string;
    zoning: string;
    landUse: string;
  }>
> = {
  fulton: {
    parcelId: 'ParcelID',
    owner: 'Owner',
    address: 'Address',
    acreage: 'LandAcres',
    appraised: 'AppraisedValue',
    taxYear: 'TaxYear',
    landUse: 'LUCode',
  },
  dekalb: {
    parcelId: 'ParcelID',
    acreage: 'StatedArea',
    zoning: 'ZONING',
    landUse: 'LANDUSE',
    taxYear: 'TAXYR',
    appraised: 'APPRAISED_VALUE',
    assessed: 'LAND_VALUE',
  },
  cobb: {
    parcelId: 'PIN',
    owner: 'OWNER',
    address: 'SITEADDR',
    appraised: 'APPRAISED',
  },
  gwinnett: {
    parcelId: 'PIN',
    address: 'ADDRESS',
    acreage: 'DEEDEDACREAGE',
  },
  forsyth: {
    parcelId: 'PARID',
    owner: 'OWNER',
    address: 'SITEADDR',
    acreage: 'ACRES',
    appraised: 'APPRAISED',
    taxYear: 'TAXYR',
  },
  floyd: {
    parcelId: 'PARCEL',
    owner: 'NAME',
    address: 'PROP_ADDR',
    acreage: 'TOTALACRES',
    appraised: 'VALUE2022',
    landUse: 'DESCRIP',
  },
  cherokee: {
    parcelId: 'PARID',
    owner: 'OWNER',
    address: 'SITEADDR',
    acreage: 'ACRES',
  },
  clarke: {
    parcelId: 'PARID',
    owner: 'OWNER',
    address: 'SITEADDR',
    acreage: 'ACRES',
    appraised: 'APPRAISED',
    taxYear: 'TAXYR',
  },
  // Default field names used when county-specific mapping is absent
  _default: {
    parcelId: 'PARID',
    owner: 'OWNER',
    address: 'SITEADDR',
    acreage: 'ACRES',
    appraised: 'APPRAISED',
  },
};

// ---------------------------------------------------------------------------
// Field extraction helpers
// ---------------------------------------------------------------------------

/** Safely extract a string attribute value */
function attrString(attrs: Record<string, unknown>, field?: string): string | undefined {
  if (!field) return undefined;
  const val = attrs[field];
  if (val === null || val === undefined) return undefined;
  const str = String(val).trim();
  return str.length > 0 ? str : undefined;
}

/** Safely extract a numeric attribute value */
function attrNumber(attrs: Record<string, unknown>, field?: string): number | undefined {
  if (!field) return undefined;
  const val = Number(attrs[field]);
  return Number.isFinite(val) ? val : undefined;
}

/** Safely extract an integer attribute value */
function attrInt(attrs: Record<string, unknown>, field?: string): number | undefined {
  if (!field) return undefined;
  const val = parseInt(String(attrs[field] ?? ''), 10);
  return Number.isFinite(val) ? val : undefined;
}

// ---------------------------------------------------------------------------
// Feature normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a raw `ArcGisFeature` into a `NormalizedProperty` using
 * county-specific field mappings.
 *
 * @param feature   - Raw ArcGIS feature from arcgisRestConnector.ts
 * @param entry     - Source registry entry
 * @param fetchedAt - ISO 8601 timestamp
 */
function normalizeFeature(
  feature: ArcGisFeature,
  entry: SourceRegistryEntry,
  fetchedAt: string
): NormalizedProperty {
  const attrs = feature.attributes;
  const fieldMap = COUNTY_FIELD_MAPS[entry.county] ?? COUNTY_FIELD_MAPS['_default'] ?? {};

  const rawParcelId = attrString(attrs, fieldMap.parcelId ?? entry.arcgisConfig?.parcelIdField) ?? '';
  const parcelId = normalizeParcelId(rawParcelId);
  const address = attrString(attrs, fieldMap.address) ?? '';
  const owner = attrString(attrs, fieldMap.owner);
  const acreage = attrNumber(attrs, fieldMap.acreage);
  const appraisedValue = attrNumber(attrs, fieldMap.appraised);
  const assessedValue = attrNumber(attrs, fieldMap.assessed);
  const taxYear = attrInt(attrs, fieldMap.taxYear);
  const zoning = attrString(attrs, fieldMap.zoning);
  const landUse = attrString(attrs, fieldMap.landUse);

  return {
    parcelId,
    rawParcelId,
    county: entry.county,
    state: 'GA',
    address,
    owner,
    acreage,
    appraisedValue,
    assessedValue,
    taxYear,
    zoning,
    landUse,
    rings: feature.rings,
    paths: feature.paths,
    latitude: feature.point?.[0],
    longitude: feature.point?.[1],
    sourceId: entry.sourceId,
    sourceName: entry.sourceName,
    sourceUrl: entry.arcgisConfig?.serviceUrl ?? entry.gisPortalUrl,
    sourceConfidence: entry.baseConfidence,
    fetchedAt,
    attribution: `${entry.sourceName} / ArcGIS ${entry.arcgisConfig?.serviceType ?? 'REST'}`,
    rawAttributes: attrs,
  };
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

/**
 * Deduplicate normalized properties by parcel ID.
 * Keeps the record with the highest source confidence.
 *
 * @param properties - Array of normalized properties (may contain duplicates)
 */
export function deduplicateByParcelId(properties: NormalizedProperty[]): NormalizedProperty[] {
  const seen = new Map<string, NormalizedProperty>();
  for (const prop of properties) {
    const key = `${prop.county}::${prop.parcelId}`;
    const existing = seen.get(key);
    if (!existing || prop.sourceConfidence > existing.sourceConfidence) {
      seen.set(key, prop);
    }
  }
  return Array.from(seen.values());
}

// ---------------------------------------------------------------------------
// Result builder
// ---------------------------------------------------------------------------

function buildResult(
  properties: NormalizedProperty[],
  entry: SourceRegistryEntry,
  arcgisResult: ArcGisConnectorResult
): CountyGisConnectorResult {
  return {
    properties,
    sourceId: entry.sourceId,
    sourceName: entry.sourceName,
    county: entry.county,
    fetchedAt: arcgisResult.fetchedAt,
    recordCount: properties.length,
    confidence: entry.baseConfidence,
    errors: arcgisResult.errors,
    isPlaceholder: entry.isPlaceholder,
  };
}

function buildEmptyResult(
  county: string,
  reason: string,
  entry?: SourceRegistryEntry
): CountyGisConnectorResult {
  return {
    properties: [],
    sourceId: entry?.sourceId ?? `${county}_county_arcgis`,
    sourceName: entry?.sourceName ?? `${county} County GIS`,
    county,
    fetchedAt: new Date().toISOString(),
    recordCount: 0,
    confidence: 0,
    errors: [reason],
    isPlaceholder: entry?.isPlaceholder ?? true,
  };
}

function ringContainsPoint(ring: [number, number][], lat: number, lon: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lonI] = ring[i];
    const [latJ, lonJ] = ring[j];
    const intersects = ((lonI > lon) !== (lonJ > lon))
      && (lat < ((latJ - latI) * (lon - lonI)) / ((lonJ - lonI) || Number.EPSILON) + latI);
    if (intersects) inside = !inside;
  }
  return inside;
}

function featureContainsPoint(feature: ArcGisFeature, lat: number, lon: number): boolean {
  return Boolean(feature.rings?.some((ring) => ringContainsPoint(ring, lat, lon)));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch parcel data for a county using a bounding box extent query.
 *
 * Suitable for map-zoom loading of all parcels within a viewport.
 * Follows the Ware County pattern from `wareCountyGisConnector.ts`.
 *
 * @param county - County name (case-insensitive, matches `LandProperty.County`)
 * @param bbox   - WGS84 bounding box
 *
 * @example
 * const result = await fetchParcelsByExtent('Fulton', { xmin: -84.5, ymin: 33.7, xmax: -84.3, ymax: 33.9 });
 */
export async function fetchParcelsByExtent(
  county: string,
  bbox: BBox
): Promise<CountyGisConnectorResult> {
  const entry = getEntryForCounty(county);

  if (!entry) {
    return buildEmptyResult(county, `No registry entry found for county: ${county}`);
  }

  if (!isSourceQueryable(entry) || !entry.arcgisConfig) {
    return buildEmptyResult(
      county,
      `Source '${entry.sourceId}' is not queryable (status: ${entry.connectorStatus}, placeholder: ${entry.isPlaceholder})`,
      entry
    );
  }

  const arcgisResult = await queryByExtent(entry.arcgisConfig, bbox, entry.sourceId);
  const fetchedAt = arcgisResult.fetchedAt;
  const properties = arcgisResult.features.map((f) => normalizeFeature(f, entry, fetchedAt));

  return buildResult(properties, entry, arcgisResult);
}

/**
 * Fetch parcel data for a county by a specific parcel ID.
 *
 * Uses a LIKE match followed by exact normalization filter (same strategy as
 * Fulton/DeKalb in wareCountyGisConnector.ts).
 *
 * @param county   - County name (case-insensitive)
 * @param parcelId - Raw parcel ID to look up
 *
 * @example
 * const result = await fetchParcelById('DeKalb', '15-123-04-001');
 */
export async function fetchParcelById(
  county: string,
  parcelId: string
): Promise<CountyGisConnectorResult> {
  const entry = getEntryForCounty(county);

  if (!entry) {
    return buildEmptyResult(county, `No registry entry found for county: ${county}`);
  }

  if (!isSourceQueryable(entry) || !entry.arcgisConfig) {
    return buildEmptyResult(
      county,
      `Source '${entry.sourceId}' is not queryable (status: ${entry.connectorStatus})`,
      entry
    );
  }

  const parcelIdField = entry.arcgisConfig.parcelIdField;
  const normalizedTarget = normalizeParcelId(parcelId);

  const arcgisResult = await queryByParcelId(
    entry.arcgisConfig,
    parcelIdField,
    parcelId,
    entry.sourceId
  );

  // Apply exact normalization filter to remove false-positive LIKE matches
  const exactFeatures = arcgisResult.features.filter((f) => {
    const sourceParcelId = normalizeParcelId(
      String(f.attributes[parcelIdField] ?? '')
    );
    return sourceParcelId === normalizedTarget || sourceParcelId.endsWith(normalizedTarget.slice(-12));
  });

  const fetchedAt = arcgisResult.fetchedAt;
  const properties = exactFeatures.map((f) => normalizeFeature(f, entry, fetchedAt));

  return buildResult(properties, entry, { ...arcgisResult, features: exactFeatures, recordCount: exactFeatures.length });
}

/**
 * Fetch the official parcel polygon containing a coordinate when a listing has
 * no verified parcel ID. This is intentionally strict: geometry is only
 * attached when exactly one returned official parcel contains the listing point.
 */
export async function fetchParcelByPoint(
  county: string,
  lat: number,
  lon: number
): Promise<CountyGisConnectorResult> {
  const entry = getEntryForCounty(county);

  if (!entry) {
    return buildEmptyResult(county, `No registry entry found for county: ${county}`);
  }

  if (!isSourceQueryable(entry) || !entry.arcgisConfig) {
    return buildEmptyResult(
      county,
      `Source '${entry.sourceId}' is not queryable (status: ${entry.connectorStatus})`,
      entry
    );
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return buildEmptyResult(county, `Invalid coordinates for ${county} County parcel lookup`, entry);
  }

  const arcgisResult = await queryByPointEnvelope(entry.arcgisConfig, lat, lon, entry.sourceId);
  const containingFeatures = arcgisResult.features.filter((feature) => featureContainsPoint(feature, lat, lon));
  const fetchedAt = arcgisResult.fetchedAt;

  if (containingFeatures.length !== 1) {
    const errors = [
      ...arcgisResult.errors,
      containingFeatures.length === 0
        ? `No official ${county} County parcel polygon contained ${lat}, ${lon}.`
        : `Ambiguous official ${county} County parcel lookup: ${containingFeatures.length} polygons contained ${lat}, ${lon}.`,
    ];
    return buildResult([], entry, { ...arcgisResult, features: [], recordCount: 0, errors });
  }

  const properties = containingFeatures.map((feature) => normalizeFeature(feature, entry, fetchedAt));
  return buildResult(properties, entry, { ...arcgisResult, features: containingFeatures, recordCount: containingFeatures.length });
}

/**
 * Fetch parcels for multiple properties using their county and parcel ID.
 *
 * Uses `Promise.allSettled` for resilience — partial failures are collected in `errors`.
 *
 * @param properties - Array of `LandProperty` objects to look up
 *
 * @example
 * const result = await fetchParcelsForProperties(landProperties);
 */
export async function fetchParcelsForProperties(
  properties: LandProperty[]
): Promise<CountyGisConnectorResult[]> {
  // Group properties by county
  const byCounty = new Map<string, LandProperty[]>();
  for (const prop of properties) {
    const county = String(prop.County ?? '').trim().toLowerCase();
    if (!county) continue;
    const group = byCounty.get(county) ?? [];
    group.push(prop);
    byCounty.set(county, group);
  }

  const results: CountyGisConnectorResult[] = [];

  for (const [county, countyProps] of byCounty.entries()) {
    const entry = getEntryForCounty(county);
    if (!entry || !isSourceQueryable(entry) || !entry.arcgisConfig) {
      results.push(
        buildEmptyResult(
          county,
          `Source not queryable for county: ${county} (status: ${entry?.connectorStatus ?? 'not_found'})`,
          entry
        )
      );
      continue;
    }

    // Build bbox from coordinates, then query by extent
    const coords = countyProps
      .map((p) => ({ lat: Number(p.Latitude), lon: Number(p.Longitude) }))
      .filter(({ lat, lon }) => Number.isFinite(lat) && Number.isFinite(lon));

    const bbox = buildBBoxFromCoords(coords);

    let arcgisResult: ArcGisConnectorResult;

    if (bbox) {
      // Extent query is efficient when we have coordinates
      arcgisResult = await queryByExtent(entry.arcgisConfig, bbox, entry.sourceId);
    } else {
      // Fall back to individual parcel ID queries
      const candidates = countyProps
        .map((p) => String(p.Parcel_ID ?? '').trim())
        .filter((id) => id.length >= 6 && !/NEEDS|UNKNOWN|PENDING/.test(id.toUpperCase()));

      if (!candidates.length) {
        results.push(
          buildEmptyResult(
            county,
            `No coordinates or valid parcel IDs for county: ${county}`,
            entry
          )
        );
        continue;
      }

      // Batch parcel ID queries using Promise.allSettled for resilience
      const settled = await Promise.allSettled(
        candidates.map((id) =>
          queryByParcelId(entry.arcgisConfig!, entry.arcgisConfig!.parcelIdField, id, entry.sourceId)
        )
      );

      const allFeatures = settled.flatMap((r) =>
        r.status === 'fulfilled' ? r.value.features : []
      );
      const allErrors = settled.flatMap((r) =>
        r.status === 'rejected' ? [String(r.reason)] : []
      );

      arcgisResult = {
        features: allFeatures,
        sourceId: entry.sourceId,
        serviceUrl: entry.arcgisConfig.serviceUrl,
        fetchedAt: new Date().toISOString(),
        recordCount: allFeatures.length,
        exceededTransferLimit: false,
        errors: allErrors,
      };
    }

    const fetchedAt = arcgisResult.fetchedAt;
    const normalized = arcgisResult.features.map((f) => normalizeFeature(f, entry, fetchedAt));
    results.push(buildResult(normalized, entry, arcgisResult));
  }

  return results;
}

/**
 * Get connector status metadata for a county (for dashboard display).
 * Does NOT make any network requests.
 *
 * @param county - County name (case-insensitive)
 */
export function getCountyConnectorStatus(county: string): CountyConnectorStatus | null {
  const entry = getEntryForCounty(county);
  if (!entry) return null;

  return {
    county: entry.county,
    sourceId: entry.sourceId,
    sourceName: entry.sourceName,
    connectorStatus: entry.connectorStatus,
    accessType: entry.accessType,
    isPlaceholder: entry.isPlaceholder,
    gisPortalUrl: entry.gisPortalUrl,
    taxAssessorUrl: entry.taxAssessorUrl,
    qPublicUrl: entry.qPublicUrl,
    baseConfidence: entry.baseConfidence,
    notes: entry.notes,
  };
}

/**
 * Get connector status for all counties in the registry.
 * Useful for a status dashboard page.
 */
export function getAllCountyConnectorStatuses(): CountyConnectorStatus[] {
  return SOURCE_REGISTRY.map((entry) => ({
    county: entry.county,
    sourceId: entry.sourceId,
    sourceName: entry.sourceName,
    connectorStatus: entry.connectorStatus,
    accessType: entry.accessType,
    isPlaceholder: entry.isPlaceholder,
    gisPortalUrl: entry.gisPortalUrl,
    taxAssessorUrl: entry.taxAssessorUrl,
    qPublicUrl: entry.qPublicUrl,
    baseConfidence: entry.baseConfidence,
    notes: entry.notes,
  }));
}

/**
 * Query a county by a custom WHERE clause (advanced use).
 *
 * @param county      - County name
 * @param whereClause - SQL WHERE clause
 */
export async function fetchParcelsByWhereClause(
  county: string,
  whereClause: string
): Promise<CountyGisConnectorResult> {
  const entry = getEntryForCounty(county);

  if (!entry) {
    return buildEmptyResult(county, `No registry entry found for county: ${county}`);
  }

  if (!isSourceQueryable(entry) || !entry.arcgisConfig) {
    return buildEmptyResult(
      county,
      `Source '${entry.sourceId}' is not queryable`,
      entry
    );
  }

  const arcgisResult = await queryByWhereClause(entry.arcgisConfig, whereClause, entry.sourceId);
  const fetchedAt = arcgisResult.fetchedAt;
  const properties = arcgisResult.features.map((f) => normalizeFeature(f, entry, fetchedAt));

  return buildResult(properties, entry, arcgisResult);
}
