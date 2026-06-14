/**
 * @file arcgisRestConnector.ts
 * @description Generic ArcGIS REST engine for querying both FeatureServer and MapServer endpoints.
 *
 * This connector is the low-level workhorse used by `countyGisConnector.ts`.
 * It handles:
 * - Bounding-box (extent) based spatial queries
 * - Where-clause attribute queries
 * - Parcel-ID targeted queries
 * - Response normalization and geometry conversion
 * - Error handling and retry-safe fetch wrappers
 *
 * All county-specific field mapping is done in `countyGisConnector.ts`, not here.
 * This module is intentionally generic so it can be reused for any ArcGIS source.
 *
 * @see src/lib/dataSources/sourceRegistry.ts for ArcGisSourceConfig type
 * @see src/lib/dataSources/connectors/countyGisConnector.ts for county routing
 */

import type { ArcGisSourceConfig } from '../sourceRegistry.js';

// ---------------------------------------------------------------------------
// Geometry types
// ---------------------------------------------------------------------------

/**
 * Bounding box in WGS84 (EPSG:4326) coordinates.
 */
export interface BBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

/**
 * GIS geometry kind.
 */
export type GisGeometryKind = 'polygon' | 'polyline' | 'point';

// ---------------------------------------------------------------------------
// ArcGIS REST API types
// ---------------------------------------------------------------------------

/** Raw feature returned from ArcGIS REST `/query` endpoint */
interface ArcGisRawFeature {
  attributes?: Record<string, unknown>;
  geometry?: {
    rings?: number[][][];
    paths?: number[][][];
    x?: number;
    y?: number;
  };
}

/** ArcGIS REST `/query` response envelope */
interface ArcGisQueryResponse {
  features?: ArcGisRawFeature[];
  exceededTransferLimit?: boolean;
  error?: {
    code?: number;
    message?: string;
    details?: string[];
  };
}

// ---------------------------------------------------------------------------
// Normalized output types
// ---------------------------------------------------------------------------

/**
 * Normalized ArcGIS feature after geometry and attribute extraction.
 * Used internally by countyGisConnector.ts for further field mapping.
 */
export interface ArcGisFeature {
  /** Constructed unique ID: `{sourceId}-{layerId}-{OBJECTID}` */
  id: string;
  /** Geometry kind determined from response shape */
  kind: GisGeometryKind;
  /** Layer ID within the service */
  layerId: number;
  /** Source ID from the registry entry */
  sourceId: string;
  /** Full service URL used for the query */
  serviceUrl: string;
  /** Polygon rings in [lat, lon] order (for polygon features) */
  rings?: [number, number][][];
  /** Polyline paths in [lat, lon] order (for polyline features) */
  paths?: [number, number][][];
  /** Point coordinates as [lat, lon] (for point features) */
  point?: [number, number];
  /** Raw attribute dictionary from the ArcGIS response */
  attributes: Record<string, unknown>;
}

/**
 * Result wrapper returned by all public functions in this module.
 */
export interface ArcGisConnectorResult {
  features: ArcGisFeature[];
  sourceId: string;
  serviceUrl: string;
  fetchedAt: string;
  recordCount: number;
  exceededTransferLimit: boolean;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Padding constant for extent queries
// ---------------------------------------------------------------------------

/** Degrees of padding added to bounding box edges for extent queries */
const QUERY_PAD_DEGREES = 0.01;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Convert ArcGIS ring/path coordinate arrays from [lon, lat] to [lat, lon].
 * ArcGIS REST returns coordinates as [x (lon), y (lat)]; Leaflet expects [lat, lon].
 *
 * @param groups - Array of coordinate groups (rings or paths)
 */
function arcgisToLatLngGroups(groups?: number[][][]): [number, number][][] {
  if (!groups) return [];
  return groups.map((group) => group.map(([lon, lat]) => [lat, lon] as [number, number]));
}

/**
 * Determine geometry kind from a raw ArcGIS feature.
 */
function detectGeometryKind(feature: ArcGisRawFeature): GisGeometryKind {
  if (feature.geometry?.rings) return 'polygon';
  if (feature.geometry?.paths) return 'polyline';
  return 'point';
}

/**
 * Build a normalized `ArcGisFeature` from a raw ArcGIS response feature.
 */
function buildFeature(
  rawFeature: ArcGisRawFeature,
  index: number,
  config: ArcGisSourceConfig,
  sourceId: string
): ArcGisFeature {
  const kind = detectGeometryKind(rawFeature);
  const objectId = String(rawFeature.attributes?.OBJECTID ?? index);
  const id = `${sourceId}-${config.layerId}-${objectId}`;

  const base: ArcGisFeature = {
    id,
    kind,
    layerId: config.layerId,
    sourceId,
    serviceUrl: config.serviceUrl,
    attributes: rawFeature.attributes ?? {},
  };

  if (kind === 'polygon') {
    base.rings = arcgisToLatLngGroups(rawFeature.geometry?.rings);
  } else if (kind === 'polyline') {
    base.paths = arcgisToLatLngGroups(rawFeature.geometry?.paths);
  } else if (rawFeature.geometry?.x !== undefined && rawFeature.geometry?.y !== undefined) {
    base.point = [rawFeature.geometry.y, rawFeature.geometry.x];
  }

  return base;
}

/**
 * Core fetch wrapper with error handling.
 * Does NOT implement retries — callers should use `Promise.allSettled` for resilience.
 *
 * @param url    - Full query URL including query parameters
 * @param label  - Human-readable label for error messages
 */
async function fetchArcGisJson(url: string, label: string): Promise<ArcGisQueryResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${label}: HTTP ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as ArcGisQueryResponse;
  if (payload.error) {
    const msg = payload.error.message ?? String(payload.error.code ?? 'unknown error');
    throw new Error(`${label}: ArcGIS error — ${msg}`);
  }
  return payload;
}

/**
 * Shared query parameter builder for ArcGIS REST queries.
 *
 * @param config    - ArcGIS source configuration
 * @param whereClause - SQL-like WHERE clause
 * @param extraParams - Additional URLSearchParams entries
 */
function buildQueryParams(
  config: ArcGisSourceConfig,
  whereClause: string,
  extraParams?: Record<string, string>
): URLSearchParams {
  return new URLSearchParams({
    f: 'json',
    where: whereClause,
    outFields: config.outFields,
    returnGeometry: 'true',
    outSR: '4326',
    resultRecordCount: String(config.resultRecordCount ?? 100),
    ...extraParams,
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Query an ArcGIS REST endpoint by a bounding box (spatial extent).
 *
 * Suitable for extent-based parcel loading (e.g., Ware County pattern).
 *
 * @param config    - ArcGIS source configuration from `SOURCE_REGISTRY`
 * @param bbox      - WGS84 bounding box; padding is applied automatically
 * @param sourceId  - Registry source ID for feature ID construction
 *
 * @example
 * const result = await queryByExtent(wareConfig, { xmin: -82.4, ymin: 31.2, xmax: -82.3, ymax: 31.3 }, 'ware_county_arcgis');
 */
export async function queryByExtent(
  config: ArcGisSourceConfig,
  bbox: BBox,
  sourceId: string
): Promise<ArcGisConnectorResult> {
  const paddedExtent = {
    xmin: bbox.xmin - QUERY_PAD_DEGREES,
    ymin: bbox.ymin - QUERY_PAD_DEGREES,
    xmax: bbox.xmax + QUERY_PAD_DEGREES,
    ymax: bbox.ymax + QUERY_PAD_DEGREES,
  };

  const params = buildQueryParams(config, '1=1', {
    geometry: JSON.stringify(paddedExtent),
    geometryType: 'esriGeometryEnvelope',
    spatialRel: 'esriSpatialRelIntersects',
    inSR: '4326',
  });

  const url = `${config.serviceUrl}/query?${params.toString()}`;
  const label = `ArcGIS extent query [${sourceId} layer ${config.layerId}]`;

  const errors: string[] = [];
  let payload: ArcGisQueryResponse = {};

  try {
    payload = await fetchArcGisJson(url, label);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  const rawFeatures = payload.features ?? [];
  const features = rawFeatures.map((f, i) => buildFeature(f, i, config, sourceId));

  return {
    features,
    sourceId,
    serviceUrl: config.serviceUrl,
    fetchedAt: new Date().toISOString(),
    recordCount: features.length,
    exceededTransferLimit: payload.exceededTransferLimit ?? false,
    errors,
  };
}

/**
 * Query an ArcGIS REST endpoint with a small, unpadded envelope around a point.
 * Use this only as an official-source fallback when parcel ID is missing;
 * callers must verify the returned polygon contains the point before attaching.
 */
export async function queryByPointEnvelope(
  config: ArcGisSourceConfig,
  lat: number,
  lon: number,
  sourceId: string,
  padDegrees = 0.00015
): Promise<ArcGisConnectorResult> {
  const envelope = {
    xmin: lon - padDegrees,
    ymin: lat - padDegrees,
    xmax: lon + padDegrees,
    ymax: lat + padDegrees,
  };
  const params = buildQueryParams(config, '1=1', {
    geometry: JSON.stringify(envelope),
    geometryType: 'esriGeometryEnvelope',
    spatialRel: 'esriSpatialRelIntersects',
    inSR: '4326',
  });

  const url = `${config.serviceUrl}/query?${params.toString()}`;
  const label = `ArcGIS point-envelope query [${sourceId} layer ${config.layerId}]`;

  const errors: string[] = [];
  let payload: ArcGisQueryResponse = {};

  try {
    payload = await fetchArcGisJson(url, label);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  const rawFeatures = payload.features ?? [];
  const features = rawFeatures.map((f, i) => buildFeature(f, i, config, sourceId));

  return {
    features,
    sourceId,
    serviceUrl: config.serviceUrl,
    fetchedAt: new Date().toISOString(),
    recordCount: features.length,
    exceededTransferLimit: payload.exceededTransferLimit ?? false,
    errors,
  };
}

/**
 * Query an ArcGIS REST endpoint using a SQL WHERE clause.
 *
 * Suitable for attribute-based lookups (e.g., parcel ID, owner name, address).
 *
 * @param config      - ArcGIS source configuration
 * @param whereClause - SQL-like WHERE clause, e.g. `"ParcelID LIKE '%12345%'"`
 * @param sourceId    - Registry source ID
 *
 * @example
 * const result = await queryByWhereClause(fultonConfig, "ParcelID LIKE '%14F007500010170%'", 'fulton_county_arcgis');
 */
export async function queryByWhereClause(
  config: ArcGisSourceConfig,
  whereClause: string,
  sourceId: string
): Promise<ArcGisConnectorResult> {
  const params = buildQueryParams(config, whereClause);
  const url = `${config.serviceUrl}/query?${params.toString()}`;
  const label = `ArcGIS where-clause query [${sourceId}]`;

  const errors: string[] = [];
  let payload: ArcGisQueryResponse = {};

  try {
    payload = await fetchArcGisJson(url, label);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  const rawFeatures = payload.features ?? [];
  const features = rawFeatures.map((f, i) => buildFeature(f, i, config, sourceId));

  return {
    features,
    sourceId,
    serviceUrl: config.serviceUrl,
    fetchedAt: new Date().toISOString(),
    recordCount: features.length,
    exceededTransferLimit: payload.exceededTransferLimit ?? false,
    errors,
  };
}

/**
 * Query an ArcGIS REST endpoint for a specific parcel ID.
 *
 * Uses exact equality first for verified parcel IDs. If no exact record is
 * returned, falls back to a LIKE candidate query; callers must still apply
 * normalized exact filtering before attaching geometry.
 *
 * @param config          - ArcGIS source configuration
 * @param parcelIdField   - The name of the parcel ID field in this source
 * @param parcelId        - Raw parcel ID (will be SQL-escaped)
 * @param sourceId        - Registry source ID
 *
 * @example
 * const result = await queryByParcelId(config, 'ParcelID', '14F-007-5-001-017-0', 'fulton_county_arcgis');
 */
export async function queryByParcelId(
  config: ArcGisSourceConfig,
  parcelIdField: string,
  parcelId: string,
  sourceId: string
): Promise<ArcGisConnectorResult> {
  // Escape single quotes in parcel ID to prevent SQL injection in WHERE clause
  const escapedId = parcelId.replace(/'/g, "''");
  const exactResult = await queryByWhereClause(config, `${parcelIdField} = '${escapedId}'`, sourceId);
  if (exactResult.features.length || exactResult.errors.length) return exactResult;

  const likeResult = await queryByWhereClause(config, `${parcelIdField} LIKE '%${escapedId}%'`, sourceId);
  return {
    ...likeResult,
    errors: [
      ...exactResult.errors,
      ...likeResult.errors,
    ],
  };
}

/**
 * Build an ArcGIS extent from a set of coordinate pairs.
 *
 * Useful when constructing a bbox from a list of properties with lat/lon.
 *
 * @param coords - Array of `{ lat, lon }` objects
 * @returns BBox or `null` if no valid coordinates provided
 */
export function buildBBoxFromCoords(
  coords: Array<{ lat: number; lon: number }>
): BBox | null {
  const valid = coords.filter(
    ({ lat, lon }) => Number.isFinite(lat) && Number.isFinite(lon)
  );
  if (!valid.length) return null;

  const lats = valid.map(({ lat }) => lat);
  const lons = valid.map(({ lon }) => lon);

  return {
    xmin: Math.min(...lons),
    ymin: Math.min(...lats),
    xmax: Math.max(...lons),
    ymax: Math.max(...lats),
  };
}

/**
 * Normalize a parcel ID to a canonical form for comparison:
 * strips non-alphanumeric characters and uppercases.
 *
 * This mirrors the strategy used in `wareCountyGisConnector.ts`.
 *
 * @param value - Raw parcel ID string
 * @returns Normalized parcel ID
 *
 * @example
 * normalizeParcelId('14F-007-5-001-017-0') // '14F0075001017O' (not real)
 */
export function normalizeParcelId(value?: string): string {
  return String(value ?? '').replace(/[^0-9A-Za-z]+/g, '').toUpperCase();
}
