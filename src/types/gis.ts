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
