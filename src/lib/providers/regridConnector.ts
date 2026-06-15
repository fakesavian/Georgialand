/**
 * Regrid parcel provider connector (STUB — dormant until licensed).
 *
 * Regrid is the near-term recommended provider (see docs/PROVIDER_FIT_DECISION_MATRIX.md):
 * all 159 Georgia counties, GeoJSON-native API, parcel geometry + APN + owner + land use.
 *
 * Activation:
 *   - Set env var VITE_REGRID_API_TOKEN (a Regrid self-serve API token).
 *   - Without it, isConfigured() is false and lookups return an empty result — NO
 *     network calls and NO paid data are made. This keeps the build credential-free.
 *
 * Licensing TODO before enabling in production (confirm with Regrid):
 *   - Written approval to store geometry in our enriched dataset (derivative works).
 *   - End-user export of Regrid-sourced fields is prohibited — gate CSV export.
 *   - Tiles may not be cached without written approval.
 */
import type { ParcelProvider, ProviderParcelResult } from './parcelProviderTypes';
import { emptyProviderResult } from './parcelProviderTypes';

const REGRID_BASE = 'https://app.regrid.com/api/v1';

function token(): string {
  return ((import.meta.env as Record<string, string | undefined>)?.VITE_REGRID_API_TOKEN) || '';
}

function normalizeFeature(feature: any, requestUrl: string, method: ProviderParcelResult['method']): ProviderParcelResult {
  const props = feature?.properties?.fields || feature?.properties || {};
  const geom = feature?.geometry || null;
  const valid = geom && (geom.type === 'Polygon' || geom.type === 'MultiPolygon') && Array.isArray(geom.coordinates) && geom.coordinates.length > 0;
  return {
    geojson: valid ? geom : null,
    apn: String(props.parcelnumb || props.parcelnumb_no_formatting || props.apn || ''),
    owner: props.owner || undefined,
    mailingAddress: props.mailadd || undefined,
    acreage: Number(props.ll_gisacre ?? props.gisacre) || undefined,
    landUse: props.usedesc || props.zoning || undefined,
    assessedValue: Number(props.parval ?? props.landval) || undefined,
    lastSaleDate: props.saledate || undefined,
    sourceUrl: requestUrl,
    confidence: valid ? 88 : 0,
    method,
    error: valid ? undefined : 'Regrid returned no usable parcel geometry',
  };
}

async function query(params: Record<string, string>, method: ProviderParcelResult['method']): Promise<ProviderParcelResult> {
  const t = token();
  if (!t) return emptyProviderResult('Regrid not configured (VITE_REGRID_API_TOKEN missing)', method);
  const url = `${REGRID_BASE}/parcels?${new URLSearchParams({ token: t, ...params }).toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return emptyProviderResult(`Regrid HTTP ${res.status}`, method);
    const json: any = await res.json();
    const feature = json?.parcels?.features?.[0] || json?.features?.[0];
    if (!feature) return emptyProviderResult('Regrid: no parcel match', method);
    // Redact the token from the stored source URL.
    return normalizeFeature(feature, url.replace(t, 'REDACTED'), method);
  } catch (err) {
    return emptyProviderResult(`Regrid request failed: ${err instanceof Error ? err.message : String(err)}`, method);
  }
}

export const regridProvider: ParcelProvider = {
  id: 'regrid',
  name: 'Regrid',
  isConfigured: () => Boolean(token()),
  lookupByApn: (_county, apn) => query({ parcelnumb: apn }, 'parcel_id'),
  lookupByPoint: (lat, lon) => query({ lat: String(lat), lon: String(lon) }, 'point'),
};

export default regridProvider;
