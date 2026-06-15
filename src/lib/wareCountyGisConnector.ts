import { LandProperty } from '../types';

export type GisGeometryKind = 'polygon' | 'polyline';

export interface VerifiedGisFeature {
  id: string;
  kind: GisGeometryKind;
  layerId: number;
  layerName: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  status: 'verified_query';
  attribution: string;
  rings?: [number, number][][];
  paths?: [number, number][][];
  attributes: Record<string, unknown>;
}

export interface GisSourceStatus {
  id: string;
  label: string;
  status: 'verified_query' | 'source_pending' | 'locked' | 'error';
  message: string;
  sourceName?: string;
  sourceUrl?: string;
  featureCount?: number;
}

interface ArcGisFeature {
  attributes?: Record<string, unknown>;
  geometry?: {
    rings?: number[][][];
    paths?: number[][][];
  };
}

interface ArcGisQueryResponse {
  features?: ArcGisFeature[];
  error?: {
    code?: number;
    message?: string;
    details?: string[];
  };
}

const WARE_COUNTY_FEATURE_SERVER = 'https://services9.arcgis.com/XAyIBOsw3fLfDjTY/arcgis/rest/services/WareCounty_Base_gdb/FeatureServer';
const FULTON_TAX_PARCELS_FEATURE_LAYER = 'https://services1.arcgis.com/AQDHTHDrZzfsFsB5/arcgis/rest/services/Tax_Parcels/FeatureServer/0';
const DEKALB_TAX_PARCELS_2025_FEATURE_LAYER = 'https://services2.arcgis.com/IxVN2oUE9EYLSnPE/arcgis/rest/services/Tax_Parcels_2025/FeatureServer/0';
const FLOYD_CURRENT_PARCELS_FEATURE_LAYER = 'https://services2.arcgis.com/nV67H1IJR8GS6SAA/ArcGIS/rest/services/Current_Parcels/FeatureServer/5';
const QUERY_PAD_DEGREES = 0.01;

const WARE_LAYERS = {
  parcels: {
    id: 38,
    name: 'Parcels',
    kind: 'polygon' as GisGeometryKind,
    outFields: 'OBJECTID,PARCEL,PARCEL_NO,MAP,BLOCK_NO,LANDLOT,ACRES,REALKEY,OWNKEY,HOUSE_NO,STREET_NAM',
  },
  zoning: {
    id: 25,
    name: 'County_Zoning',
    kind: 'polygon' as GisGeometryKind,
    outFields: 'OBJECTID,ZONE_,ZONING,ZONE_CODE,DISTRICT,ACRES',
  },
  lotLines: {
    id: 18,
    name: 'LotLines',
    kind: 'polyline' as GisGeometryKind,
    outFields: 'OBJECTID,Id,Shape__Length',
  },
};

function isWareCounty(property: LandProperty) {
  return String(property.County || '').trim().toLowerCase() === 'ware';
}

function getWareExtent(properties: LandProperty[]) {
  const coords = properties
    .filter(isWareCounty)
    .map((property) => ({ lat: Number(property.Latitude), lon: Number(property.Longitude) }))
    .filter(({ lat, lon }) => Number.isFinite(lat) && Number.isFinite(lon));

  if (!coords.length) return null;

  const lats = coords.map(({ lat }) => lat);
  const lons = coords.map(({ lon }) => lon);
  return {
    xmin: Math.min(...lons) - QUERY_PAD_DEGREES,
    ymin: Math.min(...lats) - QUERY_PAD_DEGREES,
    xmax: Math.max(...lons) + QUERY_PAD_DEGREES,
    ymax: Math.max(...lats) + QUERY_PAD_DEGREES,
  };
}

function arcgisToLatLngGroups(groups?: number[][][]): [number, number][][] {
  if (!groups) return [];
  return groups.map((group) => group.map(([lon, lat]) => [lat, lon] as [number, number]));
}

function normalizeParcelId(value?: string) {
  return String(value || '').replace(/[^0-9A-Za-z]+/g, '').toUpperCase();
}

function isFultonCounty(property: LandProperty) {
  return String(property.County || '').trim().toLowerCase() === 'fulton';
}

function isDekalbCounty(property: LandProperty) {
  return String(property.County || '').trim().toLowerCase() === 'dekalb';
}

function isFloydCounty(property: LandProperty) {
  return String(property.County || '').trim().toLowerCase() === 'floyd';
}

function getQueryableFultonParcelIds(properties: LandProperty[]) {
  const seen = new Set<string>();
  return properties
    .filter(isFultonCounty)
    .map((property) => ({ property, normalizedParcelId: normalizeParcelId(property.Parcel_ID) }))
    .filter(({ normalizedParcelId }) => normalizedParcelId.length >= 10 && !/NEEDS|PUBLISHED|UNKNOWN/.test(normalizedParcelId))
    .filter(({ normalizedParcelId }) => {
      if (seen.has(normalizedParcelId)) return false;
      seen.add(normalizedParcelId);
      return true;
    });
}

function getQueryableDekalbParcelIds(properties: LandProperty[]) {
  const seen = new Set<string>();
  return properties
    .filter(isDekalbCounty)
    .map((property) => ({ property, parcelId: String(property.Parcel_ID || '').trim(), normalizedParcelId: normalizeParcelId(property.Parcel_ID) }))
    .filter(({ parcelId, normalizedParcelId }) => parcelId.length >= 8 && normalizedParcelId.length >= 8 && !/NEEDS|PUBLISHED|UNKNOWN|PROGRAM|VERIFY/.test(normalizedParcelId))
    .filter(({ normalizedParcelId }) => {
      if (seen.has(normalizedParcelId)) return false;
      seen.add(normalizedParcelId);
      return true;
    });
}

function getQueryableFloydParcelIds(properties: LandProperty[]) {
  const seen = new Set<string>();
  return properties
    .filter(isFloydCounty)
    .map((property) => ({ property, parcelId: String(property.Parcel_ID || '').trim(), normalizedParcelId: normalizeParcelId(property.Parcel_ID) }))
    .filter(({ normalizedParcelId }) => normalizedParcelId.length >= 6 && !/NEEDS|PUBLISHED|UNKNOWN|PROGRAM|VERIFY/.test(normalizedParcelId))
    .filter(({ normalizedParcelId }) => {
      if (seen.has(normalizedParcelId)) return false;
      seen.add(normalizedParcelId);
      return true;
    });
}

async function queryWareLayer(layer: (typeof WARE_LAYERS)[keyof typeof WARE_LAYERS], extent: NonNullable<ReturnType<typeof getWareExtent>>) {
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    outFields: layer.outFields,
    returnGeometry: 'true',
    geometry: JSON.stringify(extent),
    geometryType: 'esriGeometryEnvelope',
    spatialRel: 'esriSpatialRelIntersects',
    inSR: '4326',
    outSR: '4326',
    resultRecordCount: '500',
  });

  const sourceUrl = `${WARE_COUNTY_FEATURE_SERVER}/${layer.id}`;
  const response = await fetch(`${sourceUrl}/query?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Ware County ${layer.name} query failed: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as ArcGisQueryResponse;
  if (payload.error) {
    throw new Error(`Ware County ${layer.name} query failed: ${payload.error.message || payload.error.code}`);
  }

  return (payload.features || []).map((feature, index): VerifiedGisFeature => ({
    id: `ware-${layer.id}-${String(feature.attributes?.OBJECTID || index)}`,
    kind: layer.kind,
    layerId: layer.id,
    layerName: layer.name,
    sourceId: 'ware_county_arcgis',
    sourceName: 'Ware County GIS public geodatabase',
    sourceUrl,
    status: 'verified_query',
    attribution: 'Ware County GA GIS / ArcGIS FeatureServer',
    rings: layer.kind === 'polygon' ? arcgisToLatLngGroups(feature.geometry?.rings) : undefined,
    paths: layer.kind === 'polyline' ? arcgisToLatLngGroups(feature.geometry?.paths) : undefined,
    attributes: feature.attributes || {},
  }));
}

export function hasWareCountyProperties(properties: LandProperty[]) {
  return properties.some(isWareCounty);
}

export function hasFultonParcelBoundaryCandidates(properties: LandProperty[]) {
  return getQueryableFultonParcelIds(properties).length > 0;
}

export function hasDekalbParcelBoundaryCandidates(properties: LandProperty[]) {
  return getQueryableDekalbParcelIds(properties).length > 0;
}

async function queryFultonParcelBoundary(property: LandProperty, normalizedParcelId: string) {
  const params = new URLSearchParams({
    f: 'json',
    where: `ParcelID LIKE '%${normalizedParcelId.slice(-12)}%'`,
    outFields: 'OBJECTID,ParcelID,TaxYear,Address,Owner,LandAcres,ClassCode,LUCode',
    returnGeometry: 'true',
    outSR: '4326',
    resultRecordCount: '5',
  });

  const response = await fetch(`${FULTON_TAX_PARCELS_FEATURE_LAYER}/query?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Fulton County parcel query failed: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as ArcGisQueryResponse;
  if (payload.error) {
    throw new Error(`Fulton County parcel query failed: ${payload.error.message || payload.error.code}`);
  }

  const exactFeatures = (payload.features || []).filter((feature) => {
    const sourceParcelId = normalizeParcelId(String(feature.attributes?.ParcelID || ''));
    return sourceParcelId === normalizedParcelId || sourceParcelId.endsWith(normalizedParcelId.slice(-12));
  });

  return exactFeatures.map((feature, index): VerifiedGisFeature => ({
    id: `fulton-parcel-${normalizedParcelId}-${String(feature.attributes?.OBJECTID || index)}`,
    kind: 'polygon',
    layerId: 0,
    layerName: 'Parcels',
    sourceId: 'fulton_county_arcgis',
    sourceName: 'Fulton County GIS Tax Parcels',
    sourceUrl: FULTON_TAX_PARCELS_FEATURE_LAYER,
    status: 'verified_query',
    attribution: 'Fulton County GIS / ArcGIS FeatureServer Tax Parcels',
    rings: arcgisToLatLngGroups(feature.geometry?.rings),
    attributes: {
      listingId: property.Listing_ID,
      propertyName: property.Property_Name_or_Address,
      requestedParcelId: property.Parcel_ID,
      ...(feature.attributes || {}),
    },
  }));
}

export async function fetchFultonParcelBoundaryOverlays(properties: LandProperty[]) {
  const candidates = getQueryableFultonParcelIds(properties);
  if (!candidates.length) return [];

  const settled = await Promise.allSettled(
    candidates.map(({ property, normalizedParcelId }) => queryFultonParcelBoundary(property, normalizedParcelId))
  );

  const failures = settled.filter((result) => result.status === 'rejected');
  if (failures.length === settled.length) {
    const firstFailure = failures[0] as PromiseRejectedResult | undefined;
    throw firstFailure?.reason instanceof Error ? firstFailure.reason : new Error('Fulton County parcel queries failed');
  }

  return settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
}

async function queryDekalbParcelBoundary(property: LandProperty, parcelId: string, normalizedParcelId: string) {
  const params = new URLSearchParams({
    f: 'json',
    where: `ParcelID LIKE '%${parcelId.replace(/'/g, "''")}%'`,
    outFields: 'OBJECTID,ParcelID,StatedArea,StatedAreaUnit,CalculatedArea,ZONING,LANDUSE,TAXYR,STATUS,PROPERTY_CLASS,LAND_VALUE,APPRAISED_VALUE',
    returnGeometry: 'true',
    outSR: '4326',
    resultRecordCount: '5',
  });

  const response = await fetch(`${DEKALB_TAX_PARCELS_2025_FEATURE_LAYER}/query?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`DeKalb County parcel query failed: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as ArcGisQueryResponse;
  if (payload.error) {
    throw new Error(`DeKalb County parcel query failed: ${payload.error.message || payload.error.code}`);
  }

  const exactFeatures = (payload.features || []).filter((feature) => normalizeParcelId(String(feature.attributes?.ParcelID || '')) === normalizedParcelId);

  return exactFeatures.map((feature, index): VerifiedGisFeature => ({
    id: `dekalb-parcel-${normalizedParcelId}-${String(feature.attributes?.OBJECTID || index)}`,
    kind: 'polygon',
    layerId: 0,
    layerName: 'Parcels',
    sourceId: 'dekalb_county_arcgis',
    sourceName: 'DeKalb County GIS Tax Parcels 2025',
    sourceUrl: DEKALB_TAX_PARCELS_2025_FEATURE_LAYER,
    status: 'verified_query',
    attribution: 'DeKalb County GIS / ArcGIS FeatureServer Tax Parcels 2025',
    rings: arcgisToLatLngGroups(feature.geometry?.rings),
    attributes: {
      listingId: property.Listing_ID,
      propertyName: property.Property_Name_or_Address,
      requestedParcelId: property.Parcel_ID,
      ...(feature.attributes || {}),
    },
  }));
}

export async function fetchDekalbParcelBoundaryOverlays(properties: LandProperty[]) {
  const candidates = getQueryableDekalbParcelIds(properties);
  if (!candidates.length) return [];

  const settled = await Promise.allSettled(
    candidates.map(({ property, parcelId, normalizedParcelId }) => queryDekalbParcelBoundary(property, parcelId, normalizedParcelId))
  );

  const failures = settled.filter((result) => result.status === 'rejected');
  if (failures.length === settled.length) {
    const firstFailure = failures[0] as PromiseRejectedResult | undefined;
    throw firstFailure?.reason instanceof Error ? firstFailure.reason : new Error('DeKalb County parcel queries failed');
  }

  return settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
}

export async function fetchWareCountyGisOverlays(properties: LandProperty[]) {
  const extent = getWareExtent(properties);
  if (!extent) return [];

  const layers = [WARE_LAYERS.parcels, WARE_LAYERS.zoning, WARE_LAYERS.lotLines];
  const results = await Promise.all(layers.map((layer) => queryWareLayer(layer, extent)));
  return results.flat();
}

export function buildGisSourceStatuses(properties: LandProperty[], verifiedFeatureCount: number, error?: string): GisSourceStatus[] {
  const counties = new Set(properties.map((property) => String(property.County || 'Unknown').trim()).filter(Boolean));
  const statuses: GisSourceStatus[] = [];

  const hasWareSource = Array.from(counties).some((county) => county.toLowerCase() === 'ware');
  const hasWareCoordinates = properties.some((property) => isWareCounty(property) && Number.isFinite(Number(property.Latitude)) && Number.isFinite(Number(property.Longitude)));
  if (hasWareSource) {
    statuses.push({
      id: 'ware-verified',
      label: 'Ware County parcels / zoning',
      status: error ? 'error' : 'verified_query',
      message: error
        ? `Ware County source configured, but query failed: ${error}`
        : verifiedFeatureCount > 0
          ? 'Real parcel, lot-line, and zoning geometries loaded from the verified Ware County FeatureServer where matches exist.'
          : hasWareCoordinates
            ? 'Verified Ware County source configured; no parcel/zoning features returned in the current map extent.'
            : 'Verified Ware County source configured. Current Ware listings need coordinates or parcel IDs before real parcel/zoning geometry can be queried and drawn.',
      sourceName: 'Ware County GIS public geodatabase',
      sourceUrl: WARE_COUNTY_FEATURE_SERVER,
      featureCount: verifiedFeatureCount,
    });
  }

  const fultonCandidateCount = getQueryableFultonParcelIds(properties).length;
  if (Array.from(counties).some((county) => county.toLowerCase() === 'fulton')) {
    statuses.push({
      id: 'fulton-parcels',
      label: 'Fulton property lines',
      status: error ? 'error' : fultonCandidateCount > 0 ? 'verified_query' : 'source_pending',
      message: fultonCandidateCount > 0
        ? `${fultonCandidateCount} Fulton parcel ID(s) can be queried against the official Fulton County Tax Parcels FeatureServer. Matching property lines render as red parcel outlines.`
        : 'Fulton source configured, but current Fulton rows need parcel-specific IDs before exact property lines can be drawn.',
      sourceName: 'Fulton County GIS Tax Parcels',
      sourceUrl: FULTON_TAX_PARCELS_FEATURE_LAYER,
      featureCount: verifiedFeatureCount,
    });
  }

  const dekalbCandidateCount = getQueryableDekalbParcelIds(properties).length;
  if (Array.from(counties).some((county) => county.toLowerCase() === 'dekalb')) {
    statuses.push({
      id: 'dekalb-parcels',
      label: 'DeKalb property lines',
      status: error ? 'error' : dekalbCandidateCount > 0 ? 'verified_query' : 'source_pending',
      message: dekalbCandidateCount > 0
        ? `${dekalbCandidateCount} DeKalb parcel ID(s) can be queried against the official DeKalb County Tax Parcels 2025 FeatureServer. Matching property lines render as red parcel outlines.`
        : 'DeKalb source configured, but current DeKalb rows need parcel-specific IDs before exact property lines can be drawn.',
      sourceName: 'DeKalb County GIS Tax Parcels 2025',
      sourceUrl: DEKALB_TAX_PARCELS_2025_FEATURE_LAYER,
      featureCount: verifiedFeatureCount,
    });
  }

  const floydCandidateCount = getQueryableFloydParcelIds(properties).length;
  if (Array.from(counties).some((county) => county.toLowerCase() === 'floyd')) {
    statuses.push({
      id: 'floyd-parcels',
      label: 'Floyd property lines',
      status: error ? 'error' : floydCandidateCount > 0 ? 'verified_query' : 'source_pending',
      message: floydCandidateCount > 0
        ? `${floydCandidateCount} Floyd parcel ID(s) can be queried against the official Rome/Floyd Current Parcels FeatureServer. Matching property lines render as red parcel outlines.`
        : 'Floyd source configured, but current Floyd rows need parcel-specific IDs before exact property lines can be drawn.',
      sourceName: 'Floyd County GIS Current Parcels',
      sourceUrl: FLOYD_CURRENT_PARCELS_FEATURE_LAYER,
      featureCount: verifiedFeatureCount,
    });
  }

  const pendingCounties = Array.from(counties).filter((county) => !['Ware', 'Fulton', 'DeKalb', 'Floyd'].includes(county));
  if (pendingCounties.length) {
    statuses.push({
      id: 'pending-counties',
      label: 'Parcel / zoning sources pending',
      status: 'source_pending',
      message: `${pendingCounties.join(', ')} still need verified county/city GIS connectors. Fake parcel/zoning rectangles are disabled.`,
    });
  }

  return statuses;
}
