import { GisLayerConfig } from '../types/gis';
import { AccessLevel } from './authTypes';
import {
  canViewAdvancedGisLayers,
  canViewCountyCityBoundaries,
  canViewOffMarketLeads,
  canViewParcelBoundaries,
} from './featureGates';

export const GIS_LAYER_CONFIGS: GisLayerConfig[] = [
  {
    id: 'property-pins',
    name: 'Property Pins',
    type: 'property_pins',
    endpointType: 'static',
    minAccessLevel: 'free_preview',
    enabledByDefault: true,
    attribution: 'Georgia Land Finder curated CSV',
    color: '#22c55e',
    dataStatus: 'live',
  },
  {
    id: 'county-boundaries',
    name: 'County Lines',
    type: 'county_boundary',
    endpointType: 'geojson',
    minAccessLevel: 'dashboard_starter',
    enabledByDefault: false,
    lockedDescription: 'County boundaries unlock on Starter.',
    attribution: 'US Census TIGERweb official county boundaries',
    color: '#60a5fa',
    opacity: 0.55,
    dataStatus: 'live',
  },
  {
    id: 'city-boundaries',
    name: 'City Lines',
    type: 'city_boundary',
    endpointType: 'geojson',
    minAccessLevel: 'dashboard_starter',
    enabledByDefault: false,
    lockedDescription: 'City boundaries unlock on Starter.',
    attribution: 'US Census TIGERweb incorporated/consolidated place boundaries',
    color: '#a78bfa',
    opacity: 0.45,
    dataStatus: 'live',
  },
  {
    id: 'parcel-boundaries',
    name: 'Parcel Boundaries',
    type: 'parcels',
    endpointType: 'arcgis_rest',
    minAccessLevel: 'dashboard_pro',
    enabledByDefault: false,
    lockedDescription: 'Parcel boundaries unlock on Pro.',
    attribution: 'Verified source required: Ware County ArcGIS prototype / county GIS / paid parcel vendor',
    color: '#ef4444',
    opacity: 0.9,
    // Real verified geometry, but only for parcels in GIS-enabled counties / with stored geometry.
    dataStatus: 'partial',
    dataStatusNote: 'Draws verified red boundaries where a county GIS source or stored geometry exists.',
  },
  {
    id: 'fema-flood',
    name: 'FEMA Flood Zones',
    type: 'flood',
    endpointType: 'arcgis_rest',
    url: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer',
    minAccessLevel: 'dashboard_pro',
    enabledByDefault: false,
    lockedDescription: 'Flood overlays unlock on Pro.',
    attribution: 'FEMA NFHL',
    color: '#38bdf8',
    opacity: 0.35,
    // The live FEMA NFHL overlay is not wired yet — do not render a placeholder extent.
    dataStatus: 'coming_soon',
    dataStatusNote: 'Live FEMA NFHL flood overlay not yet connected.',
  },
  {
    id: 'zoning',
    name: 'Zoning Overlays',
    type: 'zoning',
    endpointType: 'arcgis_rest',
    minAccessLevel: 'dashboard_pro',
    enabledByDefault: false,
    lockedDescription: 'Zoning overlays unlock on Pro.',
    attribution: 'Verified jurisdiction GIS required: Ware County ArcGIS prototype / city-county zoning / paid zoning vendor',
    color: '#ec4899',
    opacity: 0.35,
    // Renders only when a county GIS source returns zoning geometry for the selected parcel.
    dataStatus: 'partial',
    dataStatusNote: 'Shows verified county zoning only where a jurisdiction GIS source returns it.',
  },
  {
    id: 'off-market-candidates',
    name: 'Off-Market Candidates',
    type: 'off_market',
    endpointType: 'static',
    minAccessLevel: 'dashboard_investor',
    enabledByDefault: false,
    lockedDescription: 'Off-market candidates unlock on Investor.',
    attribution: 'Generated from parcel/tax/source signals',
    color: '#f97316',
    // No sourced off-market scoring yet — do not draw synthetic markers.
    dataStatus: 'coming_soon',
    dataStatusNote: 'Off-market candidate scoring not yet sourced.',
  },
  {
    id: 'opportunity-zones',
    name: 'Opportunity Zones',
    type: 'opportunity_zone',
    endpointType: 'geojson',
    minAccessLevel: 'dashboard_investor',
    enabledByDefault: false,
    lockedDescription: 'Opportunity Zone overlays unlock on Investor.',
    attribution: 'CDFI Fund / US Treasury Opportunity Zones',
    color: '#eab308',
    opacity: 0.35,
    dataStatus: 'coming_soon',
    dataStatusNote: 'CDFI Opportunity Zone overlay not yet connected.',
  },
  {
    id: 'land-bank-properties',
    name: 'Land Bank Properties',
    type: 'land_bank',
    endpointType: 'static',
    minAccessLevel: 'dashboard_starter',
    enabledByDefault: false,
    lockedDescription: 'Land bank layer unlocks on Starter.',
    attribution: 'Georgia land bank sources',
    color: '#8b5cf6',
    // Land-bank rows exist in the dataset, but a distinct map layer is not wired — use List filters.
    dataStatus: 'coming_soon',
    dataStatusNote: 'Distinct land-bank map layer not yet wired — filter land banks in the List view.',
  },
  {
    id: 'tax-sale-properties',
    name: 'Tax Sale Properties',
    type: 'tax_sale',
    endpointType: 'static',
    minAccessLevel: 'dashboard_starter',
    enabledByDefault: false,
    lockedDescription: 'Tax sale layer unlocks on Starter.',
    attribution: 'Georgia county tax commissioner sources',
    color: '#f59e0b',
    dataStatus: 'coming_soon',
    dataStatusNote: 'Distinct tax-sale map layer not yet wired — filter tax sales in the List view.',
  },
];

/**
 * Whether a layer has real data to render today. Layers marked 'coming_soon'
 * are configured (and tier-priced) but not yet wired to a real source — they
 * must not be toggleable or rendered, to avoid implying data that isn't there.
 */
export function isLayerDataAvailable(layer: GisLayerConfig): boolean {
  return (layer.dataStatus ?? 'live') !== 'coming_soon';
}

export function canAccessGisLayer(layer: GisLayerConfig, level: AccessLevel): boolean {
  switch (layer.type) {
    case 'property_pins':
      return true;
    case 'county_boundary':
    case 'city_boundary':
      return canViewCountyCityBoundaries(level);
    case 'parcels':
      return canViewParcelBoundaries(level);
    case 'land_bank':
    case 'tax_sale':
      return canViewCountyCityBoundaries(level); // unlocks at dashboard_starter
    case 'flood':
    case 'zoning':
    case 'environmental':
      return canViewAdvancedGisLayers(level);
    case 'opportunity_zone':
    case 'off_market':
      return canViewOffMarketLeads(level);
    default:
      return canViewAdvancedGisLayers(level);
  }
}
