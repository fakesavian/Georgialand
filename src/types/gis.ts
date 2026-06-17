export type GisLayerType =
  | 'property_pins'
  | 'parcels'
  | 'county_boundary'
  | 'city_boundary'
  | 'zoning'
  | 'flood'
  | 'tax_sale'
  | 'land_bank'
  | 'surplus'
  | 'off_market'
  | 'opportunity_zone'
  | 'roads'
  | 'utilities'
  | 'schools'
  | 'parks'
  | 'environmental'
  | 'custom';

export type GisEndpointType = 'static' | 'arcgis_rest' | 'geojson' | 'wms' | 'manual_portal';

/**
 * Whether a layer actually renders real data today.
 *  - 'live'        — real data renders now (e.g. property pins, Census boundaries).
 *  - 'partial'     — renders only for a verified subset (e.g. zoning for the selected parcel).
 *  - 'coming_soon' — configured but no real data wired yet; must NOT be toggleable or rendered.
 */
export type GisLayerDataStatus = 'live' | 'partial' | 'coming_soon';

export interface GisLayerConfig {
  id: string;
  name: string;
  type: GisLayerType;
  endpointType: GisEndpointType;
  url?: string;
  minAccessLevel: 'free_preview' | 'dashboard_starter' | 'dashboard_pro' | 'dashboard_investor' | 'admin';
  enabledByDefault: boolean;
  lockedDescription?: string;
  attribution?: string;
  lastUpdated?: string;
  notes?: string;
  color: string;
  opacity?: number;
  /** Defaults to 'live' when omitted. Honest signal for layers without real data yet. */
  dataStatus?: GisLayerDataStatus;
  /** Honest one-line reason shown when dataStatus is 'partial' or 'coming_soon'. */
  dataStatusNote?: string;
}

export interface ParcelPreview {
  parcelId: string;
  county: string;
  address?: string;
  ownerName?: string;
  acreage?: number;
  zoning?: string;
  assessedValue?: number;
  sourceUrl?: string;
  verificationLevel?: string;
}
