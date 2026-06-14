import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Polygon, Polyline, Circle, GeoJSON as LeafletGeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, BarChart3, Box, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, Heart, Layers, ListFilter, LocateFixed, Maximize2, Minimize2, MapPin, MousePointer2, Orbit, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { LandProperty } from '../../types';
import { parseScore, parsePrice, getFitScoreClass, getRiskScoreClass, displayValue, getSatelliteImageUrl, isValidUrl } from '../../utils';
import { AccessLevel } from '../../lib/authTypes';
import { GIS_LAYER_CONFIGS, canAccessGisLayer } from '../../lib/gisLayers';
import MapLayerControl from './MapLayerControl';
import GisLayerLegend from './GisLayerLegend';
import {
  buildGisSourceStatuses,
  GisSourceStatus,
  VerifiedGisFeature,
} from '../../lib/wareCountyGisConnector';
import {
  fetchCityBoundaryGeoJson,
  fetchCountyBoundaryGeoJson,
  BoundaryFeatureCollection,
} from '../../lib/censusBoundaryConnector';

const MAP_PREVIEW_MODE_KEY = 'glf_map_hover_preview_mode';
const GEORGIA_STATE_BOUNDS: L.LatLngBoundsExpression = [
  [30.35, -85.65],
  [35.15, -80.75],
];
const GEORGIA_STATE_CENTER: L.LatLngExpression = [32.95, -83.45];
const DEFAULT_STATE_ZOOM = 7;
const PIN_CLICK_AUTO_ZOOM_BELOW = 9;
const PIN_CLICK_TARGET_ZOOM = 14;
const PARCEL_FOCUS_MAX_ZOOM = 16;
type MapPreviewMode = 'auto_hide' | 'persistent';
type MapExperienceMode = '2d' | '3d';
type BaseMapId = 'satellite' | 'light' | 'dark' | 'topographic';

function getStoredMapPreviewMode(): MapPreviewMode {
  if (typeof window === 'undefined') return 'auto_hide';
  return window.localStorage.getItem(MAP_PREVIEW_MODE_KEY) === 'persistent' ? 'persistent' : 'auto_hide';
}

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function getPropertyPinId(property: LandProperty, index: number): string {
  const baseId = property.Listing_ID || property.Parcel_ID || property.Property_Name_or_Address || `${property.Latitude},${property.Longitude}`;
  return `${index}-${String(baseId).replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80)}`;
}

function hasScore(value?: string) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  const parsed = Number.parseFloat(raw.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) && parsed > 0;
}

function compactPinPrice(value: number | null) {
  if (value === null || Number.isNaN(value)) return '';
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return `${value}`;
}

function getMapPinLabel(property: LandProperty) {
  if (hasScore(property.Fit_Score_0_to_100)) return String(Math.round(parseScore(property.Fit_Score_0_to_100)));
  const priceLabel = compactPinPrice(parsePrice(property.Estimated_Price_or_Min_Bid));
  if (priceLabel) return priceLabel;
  if (property.Priority_Rank) return `#${property.Priority_Rank}`;
  const parcelKey = normalizeParcelKey(property.Parcel_ID);
  if (parcelKey) return parcelKey.slice(-3);
  return (property.County || property.City || 'GA').slice(0, 2).toUpperCase();
}

function getMapPinTone(property: LandProperty) {
  if (hasScore(property.Fit_Score_0_to_100)) {
    const fit = parseScore(property.Fit_Score_0_to_100);
    return fit >= 70 ? '#22c55e' : fit >= 40 ? '#eab308' : '#64748b';
  }
  const price = parsePrice(property.Estimated_Price_or_Min_Bid);
  if (price !== null) {
    if (price < 50_000) return '#06b6d4';
    if (price < 150_000) return '#3b82f6';
    return '#8b5cf6';
  }
  return '#475569';
}

function createCustomIcon(property: LandProperty, isHovered: boolean = false, propertyId?: string) {
  const label = getMapPinLabel(property);
  const color = getMapPinTone(property);
  const isCompact = label.length <= 3;
  const width = isCompact ? 30 : 42;
  const height = 28;
  const scale = isHovered ? 'scale(1.16)' : 'scale(1)';
  const fontSize = label.length >= 4 ? 9 : 10;
  const safeLabel = label.replace(/[<>&"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[char] || char));

  return L.divIcon({
    html: `<div data-property-pin="${propertyId || ''}" data-pin-hovered="${isHovered ? 'true' : 'false'}" data-pin-label="${safeLabel}" style="
      min-width:${width}px;height:${height}px;border-radius:999px 999px 999px 4px;
      background:${color};border:2px solid ${isHovered ? '#fff' : 'rgba(15,23,42,0.74)'};
      transform:rotate(-45deg) ${scale};display:flex;align-items:center;
      justify-content:center;box-shadow:${isHovered ? '0 0 14px rgba(34,197,94,0.9)' : '0 3px 10px rgba(0,0,0,0.55)'};
      transition: all 0.18s ease;padding:0 5px;
    "><span style="transform:rotate(45deg);font-size:${fontSize}px;font-weight:900;color:white;display:block;text-align:center;line-height:${height - 4}px;text-shadow:0 1px 2px rgba(0,0,0,0.55);white-space:nowrap;">${safeLabel}</span></div>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -30],
    className: isHovered ? 'leaflet-interactive !z-[1000]' : '',
  });
}

function formatMoneyShort(value: number | null) {
  if (value === null || Number.isNaN(value)) return 'N/A';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

function MiniTrendChart({ values, color = '#2563eb' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 180},${54 - ((value - min) / span) * 46}`).join(' ');
  return (
    <svg viewBox="0 0 180 62" className="h-20 w-full overflow-visible">
      <defs><linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor={color} stopOpacity="0.28"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polyline points={`0,60 ${points} 180,60`} fill="url(#trendFill)" stroke="none" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface MapViewProps {
  properties: LandProperty[];
  onPropertyClick: (p: LandProperty) => void;
  favoriteIds: Set<string>;
  onToggleFavorite: (p: LandProperty) => void;
  accessLevel: AccessLevel;
}

function MapInitialStateView() {
  const map = useMap();
  const hasInitialized = React.useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    map.fitBounds(GEORGIA_STATE_BOUNDS, { padding: [28, 28], animate: false, maxZoom: DEFAULT_STATE_ZOOM });
  }, [map]);

  return null;
}

function MapResizeHandler({ isExpanded }: { isExpanded: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 250);
    return () => window.clearTimeout(timer);
  }, [isExpanded, map]);
  return null;
}

function MapInteractionHandler({ onInspect }: { onInspect: () => void }) {
  const map = useMap();
  useEffect(() => {
    map.on('zoomstart dragstart movestart', onInspect);
    return () => {
      map.off('zoomstart dragstart movestart', onInspect);
    };
  }, [map, onInspect]);
  return null;
}

function getDatasetBounds(coords: [number, number][], pad = 0.045): [number, number][] {
  if (coords.length === 0) return [];
  const lats = coords.map(([lat]) => lat);
  const lons = coords.map(([, lon]) => lon);
  const minLat = Math.min(...lats) - pad;
  const maxLat = Math.max(...lats) + pad;
  const minLon = Math.min(...lons) - pad;
  const maxLon = Math.max(...lons) + pad;
  return [[minLat, minLon], [minLat, maxLon], [maxLat, maxLon], [maxLat, minLon]];
}

function GisSourceStatusPanel({ statuses }: { statuses: GisSourceStatus[] }) {
  const [isMinimized, setIsMinimized] = React.useState(true);

  if (!statuses.length) return null;

  return (
    <div className={`gis-source-status-panel absolute right-5 z-[900] max-w-[calc(100%-2rem)] rounded-2xl border border-surface-border bg-olive-950/95 text-xs text-olive-200 shadow-[0_25px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl ${isMinimized ? 'bottom-20 w-auto' : 'bottom-24 w-96 p-3'}`}>
      <button
        type="button"
        onClick={() => setIsMinimized((value) => !value)}
        className="sticky top-0 z-[2] flex w-full items-center justify-between gap-3 rounded-xl bg-olive-950/95 px-3 py-2 text-left font-bold uppercase tracking-wider text-olive-200 transition-colors hover:text-white"
        aria-expanded={!isMinimized}
      >
        <span>Source Status</span>
        <span className="rounded-full border border-olive-700 bg-olive-900 px-2 py-0.5 text-[10px] text-olive-300">
          {isMinimized ? 'Show' : 'Hide'}
        </span>
      </button>
      {!isMinimized && (
        <div className="mt-2 max-h-[min(58vh,34rem)] space-y-2 overflow-y-auto pr-1">
          {statuses.map((source) => (
            <div key={source.id} className="rounded-xl border border-olive-800 bg-olive-900/75 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white">{source.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${source.status === 'verified_query' ? 'bg-brand-900/70 text-brand-300' : source.status === 'error' ? 'bg-red-950/70 text-red-300' : 'bg-amber-950/70 text-amber-300'}`}>
                  {source.status === 'verified_query' ? 'Verified' : source.status === 'error' ? 'Error' : 'Pending'}
                </span>
              </div>
              <p className="mt-1 leading-snug text-olive-300">{source.message}</p>
              {typeof source.featureCount === 'number' && (
                <p className="mt-2 text-[10px] uppercase tracking-wide text-olive-500">Features loaded: {source.featureCount}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getFeatureBounds(feature: VerifiedGisFeature): L.LatLngBounds | null {
  const groups = feature.rings || feature.paths || [];
  const points = groups.flat();
  if (!points.length) return null;
  return L.latLngBounds(points.map(([lat, lon]) => L.latLng(lat, lon)));
}

function normalizeParcelKey(value?: string) {
  return String(value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function hasUsableParcelId(value?: string) {
  const raw = String(value || '').trim();
  const normalized = normalizeParcelKey(raw);
  if (normalized.length < 6) return false;
  return !/(NEEDS|UNKNOWN|PENDING|VERIFY|VERIFICATION|PUBLISHED|PROGRAM|PRIOR|AUCTION|SALELIST)/i.test(raw);
}

function getPropertyBoundaryKey(property: LandProperty | null) {
  if (!property) return '';
  return [property.Listing_ID, property.County, property.Parcel_ID, property.Latitude, property.Longitude].map((value) => String(value || '').trim()).join('::');
}

function SelectedParcelAutoFocus({ features, boundaryKey }: { features: VerifiedGisFeature[]; boundaryKey: string }) {
  const map = useMap();
  const lastFocusedKey = React.useRef<string>('');

  React.useEffect(() => {
    if (!boundaryKey || lastFocusedKey.current === boundaryKey || !features.length) return;
    const bounds = features.map(getFeatureBounds).find((candidate) => candidate?.isValid());
    if (!bounds?.isValid()) return;

    // Red parcel lines are often much more precise than the available satellite tiles.
    // Do not keep forcing tiny parcel bounds to zoom 19/20; that scales native imagery
    // and is the main source of the blurry click-zoom experience.
    if (map.getZoom() < PIN_CLICK_AUTO_ZOOM_BELOW) {
      map.fitBounds(bounds, { padding: [120, 120], maxZoom: PARCEL_FOCUS_MAX_ZOOM, animate: true, duration: 0.65 });
    }
    lastFocusedKey.current = boundaryKey;
  }, [boundaryKey, features, map]);

  return null;
}

function MapBaseTiles({ baseMapId }: { baseMapId: BaseMapId }) {
  if (baseMapId === 'topographic') {
    return <TileLayer data-base-map="topographic" url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" attribution='Map data: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>' maxZoom={18} maxNativeZoom={17} />;
  }
  if (baseMapId === 'light') {
    return <TileLayer data-base-map="light" url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' maxZoom={18} maxNativeZoom={18} />;
  }
  if (baseMapId === 'dark') {
    return <TileLayer data-base-map="dark" url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' maxZoom={18} maxNativeZoom={18} />;
  }
  return (
    <>
      <TileLayer data-base-map="satellite" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri" maxZoom={18} maxNativeZoom={18} updateWhenZooming={false} keepBuffer={3} />
      <TileLayer data-base-map="satellite-labels" url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" attribution="Labels &copy; Esri" maxZoom={18} maxNativeZoom={18} updateWhenZooming={false} keepBuffer={3} />
    </>
  );
}

type MobileSheetState = 'collapsed' | 'half' | 'full';

function MobileSelectedPropertySheet({
  property,
  sheetState,
  onSheetStateChange,
  onClose,
  onOpenDetails,
  isFavorite,
  onToggleFavorite,
}: {
  property: LandProperty | null;
  sheetState: MobileSheetState;
  onSheetStateChange: (state: MobileSheetState) => void;
  onClose: () => void;
  onOpenDetails: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  if (!property) return null;

  const fit = parseScore(property.Fit_Score_0_to_100);
  const risk = parseScore(property.Risk_Score_0_to_100);
  const price = parsePrice(property.Estimated_Price_or_Min_Bid);
  const location = [property.City, property.County, 'GA'].filter(Boolean).join(', ');
  const isFull = sheetState === 'full';

  return (
    <aside className={`mobile-selected-property-sheet mobile-selected-property-sheet--${sheetState}`} aria-label="Selected property summary">
      <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-olive-700" />
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onSheetStateChange(sheetState === 'collapsed' ? 'half' : 'collapsed')}
          className="min-w-0 flex-1 text-left"
          aria-label="Toggle selected property sheet"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-300">Selected land lead</p>
          <h3 className="mt-1 line-clamp-2 text-base font-black leading-tight text-white">{displayValue(property.Property_Name_or_Address)}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-olive-300"><MapPin size={12} /> {location}</p>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onToggleFavorite} className={`grid h-10 w-10 place-items-center rounded-full border ${isFavorite ? 'border-red-500/50 bg-red-500/20 text-red-300' : 'border-olive-700 bg-olive-900 text-olive-300'}`} aria-label={isFavorite ? 'Remove favorite' : 'Save favorite'}>
            <Heart size={16} className={isFavorite ? 'fill-red-400' : ''} />
          </button>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-olive-700 bg-olive-900 text-olive-300" aria-label="Close selected property">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-bold">
        <div className="rounded-2xl bg-white/10 px-3 py-2"><span className="block text-[9px] uppercase tracking-widest text-olive-500">Price</span>{price !== null ? formatMoneyShort(price) : (property.Estimated_Price_or_Min_Bid || 'N/A')}</div>
        <div className="rounded-2xl bg-white/10 px-3 py-2"><span className="block text-[9px] uppercase tracking-widest text-olive-500">Acres</span>{property.Lot_Size_Acres || 'N/A'}</div>
        <div className="rounded-2xl bg-white/10 px-3 py-2"><span className="block text-[9px] uppercase tracking-widest text-olive-500">Source</span>{property.Acquisition_Type || property.Data_Source_Type || 'Lead'}</div>
      </div>

      {sheetState !== 'collapsed' && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2 text-[11px] font-bold">
            <span className={`badge ${hasScore(property.Fit_Score_0_to_100) ? getFitScoreClass(fit) : 'bg-slate-800 text-slate-300 border border-slate-600'}`}>Fit: {hasScore(property.Fit_Score_0_to_100) ? fit : 'Needs scoring'}</span>
            <span className={`badge ${getRiskScoreClass(risk)}`}>Risk: {risk || '–'}</span>
            {property.Price_Category && <span className="badge bg-olive-800 border-olive-700 text-olive-200">{property.Price_Category}</span>}
            {property.Data_Confidence_0_to_100 && <span className="badge bg-blue-950/60 text-blue-200 border border-blue-800">Data: {property.Data_Confidence_0_to_100}</span>}
          </div>
          {property.Recommended_Next_Action && (
            <p className="line-clamp-3 rounded-2xl border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-xs font-semibold text-brand-100">→ {property.Recommended_Next_Action}</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onOpenDetails} className="rounded-2xl bg-emerald-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.35)]">Full details</button>
            <button type="button" onClick={() => onSheetStateChange(isFull ? 'half' : 'full')} className="rounded-2xl border border-olive-700 bg-olive-900 px-4 py-3 text-xs font-black uppercase tracking-wider text-olive-100">{isFull ? 'Less' : 'More'}</button>
          </div>
        </div>
      )}

      {isFull && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-olive-800 pt-3 text-xs">
          {[{ label: 'Source', url: property.Source_URL }, { label: 'Property', url: property.Property_Page_URL }, { label: 'Map', url: property.Map_URL }, { label: 'GIS', url: property.GIS_URL }].map((item) => (
            <a key={item.label} href={isValidUrl(item.url) ? item.url : undefined} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 font-black ${isValidUrl(item.url) ? 'border-brand-700 bg-brand-900/30 text-brand-200' : 'pointer-events-none border-olive-800 bg-olive-900 text-olive-600'}`}>
              <ExternalLink size={13} /> {item.label}
            </a>
          ))}
        </div>
      )}
    </aside>
  );
}

function MobileLayerSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="mobile-layer-sheet" role="dialog" aria-modal="true" aria-label="Map layers">
      <button type="button" className="mobile-layer-sheet__backdrop" onClick={onClose} aria-label="Close map layers" />
      <div className="mobile-layer-sheet__panel">
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-300">Map layers</p>
            <h3 className="text-base font-bold text-white">GIS overlays & basemap</h3>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-olive-700 bg-olive-900 text-olive-300" aria-label="Close map layers"><X size={16} /></button>
        </div>
        <div className="max-h-[68dvh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export default function MapView({ properties, onPropertyClick, favoriteIds, onToggleFavorite, accessLevel }: MapViewProps) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [previewProperty, setPreviewProperty] = React.useState<LandProperty | null>(null);
  const [selectedBoundaryProperty, setSelectedBoundaryProperty] = React.useState<LandProperty | null>(null);
  const [mapPitch, setMapPitch] = React.useState(42);
  const [previewMode, setPreviewMode] = React.useState<MapPreviewMode>(() => getStoredMapPreviewMode());
  const [experienceMode, setExperienceMode] = React.useState<MapExperienceMode>('2d');
  const [baseMapId, setBaseMapId] = React.useState<BaseMapId>('satellite');
  const [rightPanelMode, setRightPanelMode] = React.useState<'layers' | 'insights'>('insights');
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = React.useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = React.useState(false);
  const [mobileSheetState, setMobileSheetState] = React.useState<MobileSheetState>('half');
  const [isMobileLayerSheetOpen, setIsMobileLayerSheetOpen] = React.useState(false);
  const shouldAutoHidePreview = previewMode !== 'persistent';
  const [isMapExpanded, setIsMapExpanded] = React.useState(true);
  const [activeLayerIds, setActiveLayerIds] = React.useState<Set<string>>(
    () => new Set(['parcel-boundaries'])
  );
  const [verifiedGisFeatures, setVerifiedGisFeatures] = React.useState<VerifiedGisFeature[]>([]);
  const [gisSourceError, setGisSourceError] = React.useState<string | undefined>();
  const [countyBoundaryData, setCountyBoundaryData] = React.useState<BoundaryFeatureCollection | null>(null);
  const [cityBoundaryData, setCityBoundaryData] = React.useState<BoundaryFeatureCollection | null>(null);
  const [boundarySourceError, setBoundarySourceError] = React.useState<string | undefined>();
  const initializedLayersForAccess = React.useRef<AccessLevel | null>(null);

  React.useEffect(() => {
    if (initializedLayersForAccess.current === accessLevel) return;
    initializedLayersForAccess.current = accessLevel;
    setActiveLayerIds(new Set(['parcel-boundaries'].filter((layerId) => GIS_LAYER_CONFIGS.some((layer) => layer.id === layerId && canAccessGisLayer(layer, accessLevel)))));
  }, [accessLevel]);

  React.useEffect(() => {
    const syncPreviewMode = () => setPreviewMode(getStoredMapPreviewMode());
    window.addEventListener('storage', syncPreviewMode);
    window.addEventListener('glf-map-preview-mode-change', syncPreviewMode);
    return () => {
      window.removeEventListener('storage', syncPreviewMode);
      window.removeEventListener('glf-map-preview-mode-change', syncPreviewMode);
    };
  }, []);

  React.useEffect(() => {
    if (experienceMode === '3d') {
      setIsLeftPanelCollapsed(true);
      setIsRightPanelCollapsed(true);
    }
  }, [experienceMode]);

  const withCoords = React.useMemo(() => properties.filter(
    p => p.Latitude && p.Longitude && !isNaN(+p.Latitude) && !isNaN(+p.Longitude)
  ), [properties]);

  const coords: [number, number][] = React.useMemo(
    () => withCoords.map(p => [+p.Latitude, +p.Longitude]),
    [withCoords]
  );
  const activeUnlockedLayerIds = React.useMemo(
    () => new Set(GIS_LAYER_CONFIGS.filter((layer) => activeLayerIds.has(layer.id) && canAccessGisLayer(layer, accessLevel)).map((layer) => layer.id)),
    [activeLayerIds, accessLevel]
  );
  const shouldLoadVerifiedGis = activeUnlockedLayerIds.has('parcel-boundaries') || activeUnlockedLayerIds.has('zoning');
  const shouldLoadCountyBoundaries = activeUnlockedLayerIds.has('county-boundaries');
  const shouldLoadCityBoundaries = activeUnlockedLayerIds.has('city-boundaries');
  const boundaryTargetProperty = selectedBoundaryProperty;
  const selectedForInsight = previewProperty;
  const selectedBoundaryKey = React.useMemo(() => getPropertyBoundaryKey(boundaryTargetProperty), [boundaryTargetProperty]);

  React.useEffect(() => {
    let cancelled = false;
    if (!shouldLoadCountyBoundaries) {
      setCountyBoundaryData(null);
      return;
    }
    fetchCountyBoundaryGeoJson(properties)
      .then((data) => { if (!cancelled) setCountyBoundaryData(data); })
      .catch((error) => {
        if (!cancelled) {
          setCountyBoundaryData(null);
          setBoundarySourceError(error instanceof Error ? error.message : String(error));
        }
      });
    return () => { cancelled = true; };
  }, [properties, shouldLoadCountyBoundaries]);

  React.useEffect(() => {
    let cancelled = false;
    if (!shouldLoadCityBoundaries) {
      setCityBoundaryData(null);
      return;
    }
    fetchCityBoundaryGeoJson(properties)
      .then((data) => { if (!cancelled) setCityBoundaryData(data); })
      .catch((error) => {
        if (!cancelled) {
          setCityBoundaryData(null);
          setBoundarySourceError(error instanceof Error ? error.message : String(error));
        }
      });
    return () => { cancelled = true; };
  }, [properties, shouldLoadCityBoundaries]);

  React.useEffect(() => {
    let cancelled = false;
    if (!shouldLoadVerifiedGis) {
      setVerifiedGisFeatures([]);
      setGisSourceError(undefined);
      return;
    }

    const selected = boundaryTargetProperty;
    if (!selected) {
      setVerifiedGisFeatures([]);
      setGisSourceError(undefined);
      return;
    }

    const county = String(selected.County || '').trim();
    const parcelId = String(selected.Parcel_ID || '').trim();
    const lat = Number(selected.Latitude);
    const lon = Number(selected.Longitude);
    const canLookupByParcelId = county && hasUsableParcelId(parcelId);
    const canLookupByPoint = county && Number.isFinite(lat) && Number.isFinite(lon);
    if (!canLookupByParcelId && !canLookupByPoint) {
      setVerifiedGisFeatures([]);
      setGisSourceError('Parcel boundary unavailable: this listing needs a verified parcel ID or usable coordinates before a real red property line can be drawn.');
      return;
    }

    setVerifiedGisFeatures([]);
    setGisSourceError(canLookupByParcelId ? 'Loading selected property boundary…' : 'Loading official parcel boundary from selected coordinates…');
    import('../../lib/dataSources/connectors/countyGisConnector').then(({ fetchParcelById, fetchParcelByPoint }) => {
      const lookup = canLookupByParcelId
        ? fetchParcelById(county, parcelId)
        : fetchParcelByPoint(county, lat, lon);
      lookup
        .then((res) => {
          if (cancelled) return;
          const features: VerifiedGisFeature[] = res.properties.map((p) => ({
            id: `${selected.Listing_ID || parcelId}-${p.parcelId || p.rawParcelId}`,
            kind: p.rings ? 'polygon' : p.paths ? 'polyline' : 'polygon',
            layerId: 0,
            layerName: 'Parcels',
            sourceId: p.sourceId,
            sourceName: p.sourceName,
            sourceUrl: p.sourceUrl,
            status: 'verified_query',
            attribution: p.attribution,
            rings: p.rings,
            paths: p.paths,
            attributes: {
              ...p.rawAttributes,
              listingId: selected.Listing_ID,
              requestedParcelId: parcelId,
              normalizedRequestedParcelId: normalizeParcelKey(parcelId),
              county,
              propertyName: selected.Property_Name_or_Address,
            },
          }));
          setVerifiedGisFeatures(features);
          if (features.length) {
            setGisSourceError(undefined);
          } else {
            const errors = res.errors?.filter(Boolean).join('; ');
            setGisSourceError(errors || (canLookupByParcelId ? `No verified parcel boundary matched ${parcelId} in ${county} County GIS.` : `No official parcel boundary contained the selected coordinates in ${county} County GIS.`));
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setVerifiedGisFeatures([]);
            setGisSourceError(error instanceof Error ? error.message : String(error));
          }
        });
    });
    return () => { cancelled = true; };
  }, [boundaryTargetProperty, selectedBoundaryKey, shouldLoadVerifiedGis]);

  const gisSourceStatuses = React.useMemo(
    () => buildGisSourceStatuses(properties, verifiedGisFeatures.length, gisSourceError),
    [properties, verifiedGisFeatures.length, gisSourceError]
  );
  const verifiedParcelFeatures = React.useMemo(
    () => verifiedGisFeatures.filter((feature) => feature.layerName === 'Parcels' || feature.layerName === 'LotLines'),
    [verifiedGisFeatures]
  );
  const verifiedZoningFeatures = React.useMemo(
    () => verifiedGisFeatures.filter((feature) => feature.layerName === 'County_Zoning'),
    [verifiedGisFeatures]
  );
  const datasetBounds = React.useMemo(() => getDatasetBounds(coords), [coords]);

  const insightMetrics = React.useMemo(() => {
    const prices = properties.map((p) => parsePrice(p.Estimated_Price_or_Min_Bid)).filter((v): v is number => v !== null);
    const avgPrice = prices.length ? Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length) : null;
    const avgFit = properties.length ? Math.round(properties.reduce((sum, p) => sum + parseScore(p.Fit_Score_0_to_100), 0) / properties.length) : 0;
    const avgRisk = properties.length ? Math.round(properties.reduce((sum, p) => sum + parseScore(p.Risk_Score_0_to_100), 0) / properties.length) : 0;
    const trend = [avgFit * 0.82, avgFit * 0.9, avgFit * 0.86 + 7, avgFit * 0.97, avgFit + 4, avgFit + 9].map((v) => Math.max(8, Math.round(v)));
    return { avgPrice, avgFit, avgRisk, trend };
  }, [properties]);

  const handleMarkerClick = (id: string) => {
    const el = document.getElementById(`card-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleToggleLayer = (layerId: string) => {
    setActiveLayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  const clearMapPreview = React.useCallback(() => {
    if (shouldAutoHidePreview) {
      setHoveredId(null);
    }
  }, [shouldAutoHidePreview]);

  return (
    <section className={`dashboard-map-workspace relative overflow-hidden border border-white/10 bg-slate-950 shadow-[0_30px_90px_rgba(0,0,0,0.45)] ${isMapExpanded ? 'h-full min-h-full' : 'h-[720px]'}`} data-map-mode={experienceMode} style={{ '--glf-map-pitch': `${mapPitch}deg` } as React.CSSProperties}>
      <div className="absolute inset-0 z-0">
        <MapContainer center={GEORGIA_STATE_CENTER} zoom={DEFAULT_STATE_ZOOM} minZoom={6} maxZoom={18} zoomControl={false} style={{ height: '100%', width: '100%' }} className={experienceMode === '3d' ? 'glf-tilt-map glf-3d-map' : ''}>
          <ZoomControl position="bottomright" />
          <MapResizeHandler isExpanded={isMapExpanded} />
          <MapInteractionHandler onInspect={clearMapPreview} />
          <MapInitialStateView />
          {activeUnlockedLayerIds.has('parcel-boundaries') && <SelectedParcelAutoFocus features={verifiedParcelFeatures} boundaryKey={selectedBoundaryKey} />}
          <MapBaseTiles baseMapId={baseMapId} />
          {activeUnlockedLayerIds.has('county-boundaries') && countyBoundaryData && <LeafletGeoJSON key={`county-boundaries-${countyBoundaryData.features.length}`} data={countyBoundaryData as never} style={() => ({ color: '#dbeafe', weight: 2.2, opacity: 0.9, fillOpacity: 0, dashArray: '6 4' })} />}
          {activeUnlockedLayerIds.has('city-boundaries') && cityBoundaryData && <LeafletGeoJSON key={`city-boundaries-${cityBoundaryData.features.length}`} data={cityBoundaryData as never} style={() => ({ color: '#c4b5fd', weight: 1.8, opacity: 0.85, fillOpacity: 0, dashArray: '3 5' })} />}
          {activeUnlockedLayerIds.has('parcel-boundaries') && verifiedParcelFeatures.map((feature) => (
            feature.kind === 'polygon' ? feature.rings?.map((ring, ringIndex) => <Polygon key={`${feature.id}-ring-${ringIndex}`} positions={ring} pathOptions={{ color: '#ef4444', weight: 4, opacity: 1, fillColor: '#ef4444', fillOpacity: 0.08, className: 'verified-parcel-boundary-red' }} />) : feature.paths?.map((path, pathIndex) => <Polyline key={`${feature.id}-path-${pathIndex}`} positions={path} pathOptions={{ color: '#ef4444', weight: 4, opacity: 1, className: 'verified-parcel-boundary-red' }} />)
          ))}
          {activeUnlockedLayerIds.has('fema-flood') && datasetBounds.length > 0 && <Polygon positions={datasetBounds} pathOptions={{ color: '#38bdf8', weight: 1, opacity: 0.35, fillColor: '#0ea5e9', fillOpacity: 0.055 }} />}
          {activeUnlockedLayerIds.has('zoning') && verifiedZoningFeatures.map((feature) => feature.rings?.map((ring, ringIndex) => <Polygon key={`${feature.id}-zoning-${ringIndex}`} positions={ring} pathOptions={{ color: '#ec4899', weight: 1, opacity: 0.6, fillColor: '#ec4899', fillOpacity: 0.055 }} />))}
          {activeUnlockedLayerIds.has('off-market-candidates') && withCoords.map((prop, idx) => <Circle key={`offmarket-${idx}`} center={[Number(prop.Latitude), Number(prop.Longitude)]} radius={85} pathOptions={{ color: '#f97316', weight: 1.2, opacity: 0.55, fillColor: '#f97316', fillOpacity: 0.07 }} />)}
          {withCoords.map((prop, idx) => {
            const pId = getPropertyPinId(prop, properties.indexOf(prop));
            const isHovered = hoveredId === pId;
            const price = parsePrice(prop.Estimated_Price_or_Min_Bid);
            const fit = parseScore(prop.Fit_Score_0_to_100);
            const risk = parseScore(prop.Risk_Score_0_to_100);
            const imageUrl = getSatelliteImageUrl(prop.Latitude, prop.Longitude, 18);
            const propertyBoundaryKey = getPropertyBoundaryKey(prop);
            const isBoundarySelected = selectedBoundaryKey === propertyBoundaryKey;
            const boundaryStatusText = isBoundarySelected
              ? (verifiedParcelFeatures.length ? 'Verified red parcel boundary loaded.' : gisSourceError)
              : '';
            return (
              <Marker key={idx} position={[+prop.Latitude, +prop.Longitude]} icon={createCustomIcon(prop, isHovered, pId)} eventHandlers={{
                click: (event) => {
                  setSelectedBoundaryProperty(prop);
                  setPreviewProperty(prop);
                  setMobileSheetState('half');
                  setHoveredId(pId);
                  const map = event.target._map as L.Map | undefined;
                  if (!map) return;
                  const currentZoom = map.getZoom();
                  if (currentZoom < PIN_CLICK_AUTO_ZOOM_BELOW) {
                    map.flyTo([+prop.Latitude, +prop.Longitude], PIN_CLICK_TARGET_ZOOM, { animate: true, duration: 0.55 });
                  } else {
                    map.panTo([+prop.Latitude, +prop.Longitude], { animate: true, duration: 0.35 });
                  }
                },
                mouseover: () => { setHoveredId(pId); },
                add: (event) => {
                  const marker = event.target;
                  const element = marker.getElement?.();
                  if (!element) return;
                  const enter = () => { setHoveredId(pId); };
                  const leave = () => { setHoveredId((current) => (current === pId ? null : current)); };
                  element.addEventListener('mouseenter', enter);
                  element.addEventListener('mouseleave', leave);
                  marker.once('remove', () => { element.removeEventListener('mouseenter', enter); element.removeEventListener('mouseleave', leave); });
                },
                mouseout: () => { setHoveredId((current) => (current === pId ? null : current)); }
              }}>
                <Popup className="glf-property-popup" maxWidth={360} minWidth={300}>
                  <div className="w-[300px] overflow-hidden rounded-2xl bg-olive-950 text-white shadow-2xl">
                    <div className="relative h-36 bg-olive-900">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`Close-up satellite view of ${displayValue(prop.Property_Name_or_Address)}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-olive-500">
                          <MapPin size={24} className="mb-2 opacity-40" />
                          <span className="text-xs font-bold">No coordinates</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-olive-950 via-olive-950/70 to-transparent p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Property selected</p>
                      </div>
                      {prop.Priority_Rank && (
                        <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/65 px-2 py-1 text-[10px] font-black text-emerald-200 backdrop-blur">
                          #{prop.Priority_Rank}
                        </span>
                      )}
                    </div>
                    <div className="space-y-3 p-4">
                      <div>
                        <h3 className="line-clamp-2 text-sm font-black leading-tight">{displayValue(prop.Property_Name_or_Address)}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-olive-300"><MapPin size={12} /> {[prop.City, prop.County, 'GA'].filter(Boolean).join(', ')}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                        <div className="rounded-xl bg-white/10 px-3 py-2"><span className="block text-[9px] uppercase tracking-wider text-olive-500">Price</span>{price !== null ? formatMoneyShort(price) : (prop.Estimated_Price_or_Min_Bid || 'N/A')}</div>
                        <div className="rounded-xl bg-white/10 px-3 py-2"><span className="block text-[9px] uppercase tracking-wider text-olive-500">Acreage</span>{prop.Lot_Size_Acres || 'N/A'}</div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                        <span className={`badge ${hasScore(prop.Fit_Score_0_to_100) ? getFitScoreClass(fit) : 'bg-slate-800 text-slate-300 border border-slate-600'}`}>Fit: {hasScore(prop.Fit_Score_0_to_100) ? fit : 'Needs scoring'}</span>
                        <span className={`badge ${getRiskScoreClass(risk)}`}>Risk: {risk || '–'}</span>
                        {prop.Acquisition_Type && <span className="badge bg-olive-800 border-olive-700 text-olive-200">{prop.Acquisition_Type}</span>}
                      </div>
                      {prop.Recommended_Next_Action && (
                        <p className="line-clamp-2 text-[11px] font-semibold italic text-emerald-200/80">→ {prop.Recommended_Next_Action}</p>
                      )}
                      {boundaryStatusText && (
                        <div className={`rounded-xl border px-3 py-2 text-[11px] font-bold ${verifiedParcelFeatures.length ? 'border-red-400/40 bg-red-500/12 text-red-100' : 'border-amber-400/35 bg-amber-500/10 text-amber-100'}`}>
                          {boundaryStatusText}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          onPropertyClick(prop);
                        }}
                        className="w-full rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:bg-emerald-300"
                      >
                        Open property info
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className={`desktop-map-left-panel absolute left-5 top-20 z-[520] flex max-w-[calc(100%-2rem)] flex-col gap-3 transition-all duration-300 ${isLeftPanelCollapsed ? 'w-14' : 'w-[21rem] lg:w-[22rem]'}`}>
        <button type="button" onClick={() => setIsLeftPanelCollapsed((value) => !value)} className="absolute -right-3 top-5 z-[2] rounded-full border border-white/30 bg-slate-950/88 p-1.5 text-white shadow-xl backdrop-blur" aria-label={isLeftPanelCollapsed ? 'Open map tools' : 'Collapse map tools'}>
          {isLeftPanelCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
        {isLeftPanelCollapsed ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/14 bg-slate-950/80 p-3 text-white shadow-2xl backdrop-blur-xl">
            <MapPin size={18} className="text-emerald-300" />
            <Layers size={18} />
            <Search size={18} />
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-white/14 bg-white/92 text-slate-950 shadow-2xl backdrop-blur-xl">
              <div className="p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.24em] text-blue-700">Georgia Land Finder</p>
                    <h2 className="text-sm font-black">Map Tools</h2>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">{withCoords.length} mapped</span>
                </div>
                <button type="button" onClick={() => setRightPanelMode('layers')} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
                  <span className="inline-flex items-center gap-2"><Layers size={14}/> Map layers</span>
                  <span>{activeUnlockedLayerIds.size} on</span>
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5 border-t border-slate-200 p-2 text-[10px] font-black uppercase text-slate-600">
                {[
                  { label: 'Inspect', icon: MousePointer2 },
                  { label: 'Locate', icon: LocateFixed },
                  { label: 'Filter', icon: ListFilter },
                  { label: 'Value', icon: BarChart3 },
                ].map(({ label, icon: Icon }) => <button key={label} type="button" className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white py-2 shadow-sm transition hover:border-blue-300 hover:text-blue-700"><Icon size={14}/>{label}</button>)}
              </div>
            </div>
            {selectedForInsight && (
              <div className="rounded-2xl border border-white/14 bg-slate-950/86 p-4 text-white shadow-2xl backdrop-blur-xl">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Selected property</p>
                  <button type="button" onClick={() => onPropertyClick(selectedForInsight)} className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase text-slate-950">Details</button>
                </div>
                <h3 className="line-clamp-2 text-sm font-black">{displayValue(selectedForInsight.Property_Name_or_Address)}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-300"><MapPin size={12} /> {[selectedForInsight.City, selectedForInsight.County, 'GA'].filter(Boolean).join(', ')}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <span className={`badge ${hasScore(selectedForInsight.Fit_Score_0_to_100) ? getFitScoreClass(parseScore(selectedForInsight.Fit_Score_0_to_100)) : 'bg-slate-800 text-slate-300 border border-slate-600'}`}>Fit: {hasScore(selectedForInsight.Fit_Score_0_to_100) ? parseScore(selectedForInsight.Fit_Score_0_to_100) : 'Needs scoring'}</span>
                  <span className={`badge ${getRiskScoreClass(parseScore(selectedForInsight.Risk_Score_0_to_100))}`}>Risk: {parseScore(selectedForInsight.Risk_Score_0_to_100) || '–'}</span>
                  <span className="rounded-lg bg-white/10 px-2 py-1 font-bold">{selectedForInsight.Estimated_Price_or_Min_Bid || 'Price N/A'}</span>
                  <span className="rounded-lg bg-white/10 px-2 py-1 font-bold">{selectedForInsight.Lot_Size_Acres || 'Acres N/A'}</span>
                </div>
                <div className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-[11px] font-semibold ${verifiedParcelFeatures.length ? 'border-red-400/40 bg-red-500/12 text-red-100' : 'border-amber-400/30 bg-amber-500/10 text-amber-100'}`}>
                  {verifiedParcelFeatures.length ? <CheckCircle2 size={13} className="mt-0.5 shrink-0" /> : <AlertTriangle size={13} className="mt-0.5 shrink-0" />}
                  <span>{verifiedParcelFeatures.length ? 'Verified red parcel boundary loaded for this selected property.' : (gisSourceError || 'Select a property with a verified parcel ID to load its red boundary.')}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className={`desktop-map-right-panel absolute right-5 top-20 z-[520] flex max-w-[calc(100%-2rem)] flex-col gap-3 transition-all duration-300 ${isRightPanelCollapsed ? 'w-14' : 'w-[20rem] xl:w-[21rem]'}`}>
        <button type="button" onClick={() => setIsRightPanelCollapsed((value) => !value)} className="absolute -left-3 top-5 z-[2] rounded-full border border-white/30 bg-slate-950/88 p-1.5 text-white shadow-xl backdrop-blur" aria-label={isRightPanelCollapsed ? 'Open insights panel' : 'Collapse insights panel'}>
          {isRightPanelCollapsed ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
        {isRightPanelCollapsed ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/14 bg-white/88 p-3 text-slate-950 shadow-2xl backdrop-blur-xl">
            <BarChart3 size={18} />
            <Layers size={18} />
          </div>
        ) : (
          <div className="rounded-2xl border border-white/14 bg-white/92 p-3 text-slate-950 shadow-2xl backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex rounded-xl bg-slate-100 p-1 text-[11px] font-black">
                <button type="button" onClick={() => setRightPanelMode('insights')} className={`rounded-lg px-3 py-1.5 ${rightPanelMode === 'insights' ? 'bg-blue-700 text-white shadow' : 'text-slate-600'}`}>Insights</button>
                <button type="button" onClick={() => setRightPanelMode('layers')} className={`rounded-lg px-3 py-1.5 ${rightPanelMode === 'layers' ? 'bg-blue-700 text-white shadow' : 'text-slate-600'}`}>Map Layers</button>
              </div>
              <button type="button" onClick={() => setIsMapExpanded((value) => !value)} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:text-slate-950">{isMapExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>
            </div>
            {rightPanelMode === 'layers' ? <MapLayerControl layers={GIS_LAYER_CONFIGS} activeLayerIds={activeLayerIds} accessLevel={accessLevel} baseMapId={baseMapId} onBaseMapChange={(value) => setBaseMapId(value as BaseMapId)} onToggleLayer={handleToggleLayer} onClose={() => setRightPanelMode('insights')} /> : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="rounded-xl bg-slate-100 p-2"><b className="block text-lg text-slate-950">{insightMetrics.avgFit}%</b>Avg fit</div>
                  <div className="rounded-xl bg-slate-100 p-2"><b className="block text-lg text-slate-950">{insightMetrics.avgRisk}%</b>Avg risk</div>
                  <div className="rounded-xl bg-slate-100 p-2"><b className="block text-lg text-slate-950">{formatMoneyShort(insightMetrics.avgPrice)}</b>Avg price</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Market score trend</p>
                  <MiniTrendChart values={insightMetrics.trend} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mobile-map-action-rail" aria-label="Map actions">
        <button type="button" onClick={() => setIsMobileLayerSheetOpen(true)} aria-label="Open map layers">
          <Layers size={18} />
          <span>Layers</span>
        </button>
        <button type="button" onClick={() => setExperienceMode((mode) => mode === '2d' ? '3d' : '2d')} aria-pressed={experienceMode === '3d'} aria-label="Toggle 3D map">
          {experienceMode === '3d' ? <Orbit size={18} /> : <Box size={18} />}
          <span>{experienceMode === '3d' ? '2D' : '3D'}</span>
        </button>
        <button type="button" onClick={() => setPreviewProperty(null)} aria-label="Clear selected property">
          <X size={18} />
          <span>Clear</span>
        </button>
      </div>

      {isMobileLayerSheetOpen && (
        <MobileLayerSheet onClose={() => setIsMobileLayerSheetOpen(false)}>
          <MapLayerControl layers={GIS_LAYER_CONFIGS} activeLayerIds={activeLayerIds} accessLevel={accessLevel} baseMapId={baseMapId} onBaseMapChange={(value) => setBaseMapId(value as BaseMapId)} onToggleLayer={handleToggleLayer} onClose={() => setIsMobileLayerSheetOpen(false)} />
        </MobileLayerSheet>
      )}

      {experienceMode === '3d' && (
        <div className="desktop-map-3d-control absolute left-1/2 top-20 z-[530] w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-cyan-300/30 bg-slate-950/82 p-3 text-white shadow-2xl backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-200"><SlidersHorizontal size={14} /> Functional 3D map pitch</div>
            <span className="rounded-full bg-cyan-400/15 px-2 py-1 text-[10px] font-black text-cyan-200">{mapPitch}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="62"
            value={mapPitch}
            onChange={(event) => setMapPitch(Number(event.target.value))}
            className="w-full accent-cyan-300"
            aria-label="3D map pitch"
          />
          <p className="mt-2 text-[11px] font-semibold text-cyan-100/75">Uses the real live map, pins, and red parcel boundaries. Click a property to zoom; hover will not move the map.</p>
        </div>
      )}

      <div className="desktop-map-stats-bar absolute bottom-4 left-1/2 z-[520] w-[min(34rem,calc(100%-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/15 bg-slate-950/82 text-white shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-2 divide-x divide-white/10 sm:grid-cols-5">
          <div className="p-2.5 text-center"><p className="text-[9px] uppercase tracking-widest text-slate-500">Listings</p><b className="font-mono text-base">{properties.length}</b></div>
          <div className="p-2.5 text-center"><p className="text-[9px] uppercase tracking-widest text-slate-500">Mapped</p><b className="font-mono text-base text-emerald-300">{withCoords.length}</b></div>
          <div className="p-2.5 text-center"><p className="text-[9px] uppercase tracking-widest text-slate-500">Avg Fit</p><b className="font-mono text-base text-blue-300">{insightMetrics.avgFit}%</b></div>
          <div className="p-2.5 text-center"><p className="text-[9px] uppercase tracking-widest text-slate-500">Avg Risk</p><b className="font-mono text-base text-amber-300">{insightMetrics.avgRisk}%</b></div>
          <div className="flex items-center justify-center p-3">
            <button type="button" onClick={() => setExperienceMode((mode) => mode === '2d' ? '3d' : '2d')} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.55)] transition hover:bg-cyan-300" aria-pressed={experienceMode === '3d'}>
              {experienceMode === '3d' ? <Orbit size={15} /> : <Box size={15} />}
              {experienceMode === '3d' ? 'Exit 3D' : 'Enter 3D'}
            </button>
          </div>
        </div>
      </div>

      <div className="absolute left-4 bottom-4 z-[520] hidden max-w-xs rounded-xl xl:hidden border border-cyan-300/30 bg-slate-950/75 p-3 text-[11px] font-semibold text-cyan-100 shadow-xl backdrop-blur lg:block">
        <div className="mb-1 flex items-center gap-2 font-black uppercase tracking-wider"><Sparkles size={13}/> Interactive map-first workspace</div>
        <p className="text-cyan-100/75">3D mode tilts the live map with real pins and parcel boundaries; click pins to zoom.</p>
      </div>
      <GisSourceStatusPanel statuses={gisSourceStatuses} />
      <GisLayerLegend layers={GIS_LAYER_CONFIGS} activeLayerIds={activeLayerIds} />
      <MobileSelectedPropertySheet
        property={previewProperty}
        sheetState={mobileSheetState}
        onSheetStateChange={setMobileSheetState}
        onClose={() => {
          setPreviewProperty(null);
          setHoveredId(null);
        }}
        onOpenDetails={() => previewProperty && onPropertyClick(previewProperty)}
        isFavorite={previewProperty ? favoriteIds.has(previewProperty.Parcel_ID || previewProperty.Property_Name_or_Address) : false}
        onToggleFavorite={() => previewProperty && onToggleFavorite(previewProperty)}
      />
    </section>
  );
}
