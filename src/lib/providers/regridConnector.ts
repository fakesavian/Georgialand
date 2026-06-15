/**
 * Regrid parcel provider connector (STUB — dormant until licensed).
 *
 * Regrid is the near-term recommended provider (see docs/PROVIDER_FIT_DECISION_MATRIX.md):
 * all 159 Georgia counties, GeoJSON-native API, parcel geometry + APN + owner + land use.
 *
 * ── SERVER-ONLY ──────────────────────────────────────────────────────────────
 * A Regrid API token is a PRIVATE, PAID credential. It must NEVER be exposed to the
 * browser, so:
 *   - The token is read from process.env.REGRID_API_TOKEN (NOT a VITE_ variable, so
 *     Vite never inlines it into the client bundle).
 *   - This module must only be invoked from server code: a Vercel API function under
 *     /api, or a Node script. Browser/React code must call a same-origin serverless
 *     endpoint (e.g. /api/parcel-provider-lookup) instead of importing this directly.
 *   - In a browser context getRegridToken() returns '' and isConfigured() is false,
 *     so no network call is made and nothing leaks even if imported by accident.
 *
 * Public, browser-safe Regrid *tile* tokens (if any) are a SEPARATE credential and
 * may only be exposed client-side if Regrid explicitly designates them as public —
 * do not reuse this private API token for tiles.
 *
 * Licensing TODO before enabling in production (confirm with Regrid):
 *   - Written approval to store geometry in our enriched dataset (derivative works).
 *   - End-user export of Regrid-sourced fields is prohibited — gate CSV export.
 *   - Tiles may not be cached without written approval.
 */
import type { ParcelProvider, ProviderParcelResult } from './parcelProviderTypes';
import { emptyProviderResult } from './parcelProviderTypes';

const REGRID_BASE = 'https://app.regrid.com/api/v1';

/** Server-only token accessor. Returns '' in the browser (process is undefined there). */
function getRegridToken(): string {
  if (typeof process === 'undefined' || !process.env) return '';
  return process.env.REGRID_API_TOKEN || '';
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
  const token = getRegridToken();
  if (!token) return emptyProviderResult('Regrid not configured (server-only REGRID_API_TOKEN missing)', method);
  const url = `${REGRID_BASE}/parcels?${new URLSearchParams({ token, ...params }).toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return emptyProviderResult(`Regrid HTTP ${res.status}`, method);
    const json: any = await res.json();
    const feature = json?.parcels?.features?.[0] || json?.features?.[0];
    if (!feature) return emptyProviderResult('Regrid: no parcel match', method);
    // Redact the token from the stored source URL so it is never persisted.
    return normalizeFeature(feature, url.replace(token, 'REDACTED'), method);
  } catch (err) {
    return emptyProviderResult(`Regrid request failed: ${err instanceof Error ? err.message : String(err)}`, method);
  }
}

export const regridProvider: ParcelProvider = {
  id: 'regrid',
  name: 'Regrid',
  isConfigured: () => Boolean(getRegridToken()),
  lookupByApn: (_county, apn) => query({ parcelnumb: apn }, 'parcel_id'),
  lookupByPoint: (lat, lon) => query({ lat: String(lat), lon: String(lon) }, 'point'),
};

export default regridProvider;
