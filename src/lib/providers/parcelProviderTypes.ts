/**
 * Common interface for licensed parcel/property providers.
 *
 * See docs/PROVIDER_FIT_DECISION_MATRIX.md for the fit analysis. Near-term
 * candidate is Regrid (parcel geometry + APN, all 159 GA counties, GeoJSON API).
 *
 * IMPORTANT (accuracy + licensing): connectors NEVER fabricate geometry, and they
 * must remain dormant unless explicitly configured with a license token. No paid
 * data is fetched without credentials, and provider-sourced geometry is subject to
 * the provider's license (e.g. Regrid forbids end-user export and requires written
 * approval for derivative works — gate exports accordingly before enabling).
 */

export interface ProviderParcelResult {
  /** Standard GeoJSON Polygon/MultiPolygon geometry (WGS84 [lon,lat]) or null when unverified. */
  geojson: Record<string, any> | null;
  /** Standardized parcel number (APN) as returned by the provider. */
  apn: string;
  owner?: string;
  mailingAddress?: string;
  acreage?: number;
  landUse?: string;
  assessedValue?: number;
  lastSaleDate?: string;
  /** Provider request URL used (for audit trail). */
  sourceUrl: string;
  /** 0-100 confidence in the match. */
  confidence: number;
  method: 'parcel_id' | 'address' | 'point' | 'none';
  error?: string;
}

export interface ParcelProvider {
  /** Stable id, e.g. "regrid". */
  id: string;
  /** Human-readable name. */
  name: string;
  /** True only when a license token/env var is present. Connectors stay dormant otherwise. */
  isConfigured(): boolean;
  lookupByApn(county: string, apn: string): Promise<ProviderParcelResult>;
  lookupByPoint(lat: number, lon: number): Promise<ProviderParcelResult>;
}

export function emptyProviderResult(error: string, method: ProviderParcelResult['method'] = 'none'): ProviderParcelResult {
  return { geojson: null, apn: '', sourceUrl: '', confidence: 0, method, error };
}
