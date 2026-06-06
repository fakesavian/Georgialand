import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, ZoomControl, Polygon, Rectangle, Circle, LayerGroup } from 'react-leaflet';
import L, { LatLngBoundsExpression } from 'leaflet';
import { Maximize2, Minimize2, MapPin } from 'lucide-react';
import { LandProperty } from '../../types';
import PropertyCard from './PropertyCard';
import { parseScore, getFitScoreClass, getRiskScoreClass, displayValue, getSatelliteImageUrl } from '../../utils';
import { AccessLevel } from '../../lib/authTypes';
import { GIS_LAYER_CONFIGS, canAccessGisLayer } from '../../lib/gisLayers';
import MapLayerControl from './MapLayerControl';
import GisLayerLegend from './GisLayerLegend';

const { BaseLayer } = LayersControl;
const MAP_PREVIEW_MODE_KEY = 'glf_map_hover_preview_mode';
type MapPreviewMode = 'auto_hide' | 'persistent';

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

function createCustomIcon(fit: number, isHovered: boolean = false, propertyId?: string) {
  const color = fit >= 70 ? '#22c55e' : fit >= 40 ? '#eab308' : '#6b7280';
  const scale = isHovered ? 'scale(1.2)' : 'scale(1)';
  const zIndex = isHovered ? 1000 : 0;
  
  return L.divIcon({
    html: `<div data-property-pin="${propertyId || ''}" style="
      width:28px;height:28px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid ${isHovered ? '#fff' : 'rgba(0,0,0,0.5)'};
      transform:rotate(-45deg) ${scale};display:flex;align-items:center;
      justify-content:center;box-shadow:${isHovered ? '0 0 12px rgba(34,197,94,0.8)' : '0 2px 8px rgba(0,0,0,0.6)'};
      transition: all 0.2s;
    "><span style="transform:rotate(45deg);font-size:10px;font-weight:700;color:white;display:block;text-align:center;line-height:24px;">${Math.round(fit)||'?'}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
    className: isHovered ? 'leaflet-interactive !z-[1000]' : '',
  });
}

interface MapViewProps {
  properties: LandProperty[];
  onPropertyClick: (p: LandProperty) => void;
  favoriteIds: Set<string>;
  onToggleFavorite: (p: LandProperty) => void;
  accessLevel: AccessLevel;
}

function MapBoundsUpdater({ coords, boundsKey }: { coords: [number, number][]; boundsKey: string }) {
  const map = useMap();
  const lastBoundsKey = React.useRef<string | null>(null);

  useEffect(() => {
    if (coords.length > 0 && lastBoundsKey.current !== boundsKey) {
      map.fitBounds(coords, { padding: [40, 40], maxZoom: 13 });
      lastBoundsKey.current = boundsKey;
    }
  }, [boundsKey, coords, map]);
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

function parcelBounds(lat: number, lon: number, size = 0.0012): LatLngBoundsExpression {
  return [
    [lat - size, lon - size],
    [lat + size, lon + size],
  ];
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

function getGroupedBounds(properties: LandProperty[], groupKey: keyof LandProperty, pad = 0.025) {
  const groups = new Map<string, [number, number][]>()
  properties.forEach((property) => {
    const lat = Number(property.Latitude);
    const lon = Number(property.Longitude);
    const key = String(property[groupKey] || 'Unknown');
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const group = groups.get(key) || [];
    group.push([lat, lon]);
    groups.set(key, group);
  });
  return [...groups.entries()].map(([key, coords]) => ({ key, coords: getDatasetBounds(coords, pad) })).filter((group) => group.coords.length > 0);
}

export default function MapView({ properties, onPropertyClick, favoriteIds, onToggleFavorite, accessLevel }: MapViewProps) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [previewProperty, setPreviewProperty] = React.useState<LandProperty | null>(null);
  const [previewMode, setPreviewMode] = React.useState<MapPreviewMode>(() => getStoredMapPreviewMode());
  const shouldAutoHidePreview = previewMode !== 'persistent';
  const [isMapExpanded, setIsMapExpanded] = React.useState(false);
  const [activeLayerIds, setActiveLayerIds] = React.useState<Set<string>>(
    () => new Set(GIS_LAYER_CONFIGS.filter((layer) => layer.enabledByDefault).map((layer) => layer.id))
  );
  const initializedLayersForAccess = React.useRef<AccessLevel | null>(null);

  React.useEffect(() => {
    if (initializedLayersForAccess.current === accessLevel) return;
    initializedLayersForAccess.current = accessLevel;
    setActiveLayerIds(new Set(GIS_LAYER_CONFIGS.filter((layer) => canAccessGisLayer(layer, accessLevel)).map((layer) => layer.id)));
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

  const withCoords = React.useMemo(() => properties.filter(
    p => p.Latitude && p.Longitude && !isNaN(+p.Latitude) && !isNaN(+p.Longitude)
  ), [properties]);

  const coords: [number, number][] = React.useMemo(
    () => withCoords.map(p => [+p.Latitude, +p.Longitude]),
    [withCoords]
  );
  const boundsKey = React.useMemo(
    () => withCoords.map((p) => p.Listing_ID || p.Parcel_ID || `${p.Latitude},${p.Longitude}`).join('|'),
    [withCoords]
  );
  const activeUnlockedLayerIds = React.useMemo(
    () => new Set(GIS_LAYER_CONFIGS.filter((layer) => activeLayerIds.has(layer.id) && canAccessGisLayer(layer, accessLevel)).map((layer) => layer.id)),
    [activeLayerIds, accessLevel]
  );
  const datasetBounds = React.useMemo(() => getDatasetBounds(coords), [coords]);
  const countyBounds = React.useMemo(() => getGroupedBounds(withCoords, 'County', 0.035), [withCoords]);
  const cityBounds = React.useMemo(() => getGroupedBounds(withCoords, 'City', 0.018), [withCoords]);
  const propertyByPinId = React.useMemo(() => {
    const map = new Map<string, LandProperty>();
    withCoords.forEach((property) => {
      const id = property.Parcel_ID || property.Property_Name_or_Address.replace(/\s+/g, '-');
      map.set(id, property);
    });
    return map;
  }, [withCoords]);

  React.useEffect(() => {
    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const pin = target?.closest?.('[data-property-pin]') as HTMLElement | null;
      const pinId = pin?.dataset.propertyPin;
      if (!pinId) return;
      const property = propertyByPinId.get(pinId);
      if (!property) return;
      setHoveredId(pinId);
      setPreviewProperty(property);
    };
    const handlePointerOut = (event: PointerEvent) => {
      if (!shouldAutoHidePreview) return;
      const target = event.target as HTMLElement | null;
      const pin = target?.closest?.('[data-property-pin]') as HTMLElement | null;
      if (!pin) return;
      setHoveredId(null);
      setPreviewProperty(null);
    };
    document.addEventListener('pointerover', handlePointerOver);
    document.addEventListener('pointerout', handlePointerOut);
    return () => {
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('pointerout', handlePointerOut);
    };
  }, [propertyByPinId, shouldAutoHidePreview]);

  const handleMarkerClick = (id: string) => {
    const el = document.getElementById(`card-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
    setPreviewProperty(null);
    setHoveredId(null);
  }, []);

  return (
    <div className={`flex flex-col gap-4 ${isMapExpanded ? 'min-h-[900px]' : 'lg:flex-row h-[calc(100vh-180px)] min-h-[600px]'}`}>
      {/* Map Column */}
      <div className={`${isMapExpanded ? 'h-[78vh] min-h-[720px] w-full' : 'flex-1 lg:w-[55%] xl:w-[60%]'} rounded-xl overflow-hidden border border-surface-border relative z-10 shrink-0 transition-all duration-300`}>
        <button
          type="button"
          onClick={() => setIsMapExpanded((value) => !value)}
          className="absolute right-3 top-16 z-[550] inline-flex items-center gap-2 rounded-lg border border-surface-border bg-olive-950/90 px-3 py-2 text-xs font-bold text-olive-100 shadow-xl backdrop-blur transition-colors hover:border-brand-500/60 hover:text-white"
          aria-pressed={isMapExpanded}
        >
          {isMapExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {isMapExpanded ? 'Shrink map' : 'Enlarge map'}
        </button>
        <MapLayerControl
          layers={GIS_LAYER_CONFIGS}
          activeLayerIds={activeLayerIds}
          accessLevel={accessLevel}
          onToggleLayer={handleToggleLayer}
        />
        <GisLayerLegend layers={GIS_LAYER_CONFIGS} activeLayerIds={activeLayerIds} />
        {previewProperty && (() => {
          const previewFit = parseScore(previewProperty.Fit_Score_0_to_100);
          const previewRisk = parseScore(previewProperty.Risk_Score_0_to_100);
          const previewImage = getSatelliteImageUrl(previewProperty.Latitude, previewProperty.Longitude, 18);
          return (
            <div className="property-hover-preview absolute right-3 top-28 z-[560] w-72 max-w-[calc(100%-1.5rem)] overflow-hidden rounded-2xl border border-surface-border bg-olive-950/95 text-white shadow-2xl backdrop-blur">
              {previewImage && (
                <img
                  src={previewImage}
                  alt={`Satellite view of ${displayValue(previewProperty.Property_Name_or_Address)}`}
                  className="h-28 w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold leading-snug text-white">
                      {displayValue(previewProperty.Property_Name_or_Address)}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-olive-400">
                      <MapPin size={11} /> {[previewProperty.City, previewProperty.County, 'GA'].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewProperty(null)}
                    className="rounded-full bg-olive-900 px-2 py-1 text-[10px] text-olive-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`badge ${getFitScoreClass(previewFit)} text-xs`}>Fit: {previewFit || '–'}</span>
                  <span className={`badge ${getRiskScoreClass(previewRisk)} text-xs`}>Risk: {previewRisk || '–'}</span>
                  {previewProperty.Lot_Size_Acres && <span className="badge bg-olive-800 border-olive-700 text-olive-200 text-xs">{previewProperty.Lot_Size_Acres} ac</span>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-olive-300">
                  <span><span className="text-olive-600">Price:</span> {previewProperty.Estimated_Price_or_Min_Bid || previewProperty.Price_Category || 'N/A'}</span>
                  <span><span className="text-olive-600">Zoning:</span> {previewProperty.Zoning || 'N/A'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onPropertyClick(previewProperty)}
                  className="w-full rounded-lg bg-brand-600 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-500"
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })()}
        <MapContainer
          center={[33.749, -84.388]}
          zoom={9}
          maxZoom={22}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <ZoomControl position="bottomright" />
          <MapResizeHandler isExpanded={isMapExpanded} />
          <MapInteractionHandler onInspect={clearMapPreview} />
          <LayersControl position="topright">
            <BaseLayer checked name="Dark Road">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                maxZoom={22}
                maxNativeZoom={20}
              />
            </BaseLayer>
            <BaseLayer name="Light Road">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                maxZoom={22}
                maxNativeZoom={20}
              />
            </BaseLayer>
            <BaseLayer name="Satellite">
              <LayerGroup>
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles &copy; Esri"
                  maxZoom={22}
                  maxNativeZoom={17}
                />
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                  attribution="Labels &copy; Esri"
                  maxZoom={22}
                  maxNativeZoom={17}
                />
              </LayerGroup>
            </BaseLayer>
            <BaseLayer name="Topographic">
              <TileLayer
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                attribution='Map data: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
                maxZoom={22}
                maxNativeZoom={17}
              />
            </BaseLayer>
          </LayersControl>

          {activeUnlockedLayerIds.has('county-boundaries') && countyBounds.map((group) => (
            <Polygon
              key={`county-${group.key}`}
              positions={group.coords}
              pathOptions={{ color: '#60a5fa', weight: 2, opacity: 0.55, fillOpacity: 0.015, dashArray: '8 8' }}
            />
          ))}
          {activeUnlockedLayerIds.has('city-boundaries') && cityBounds.map((group) => (
            <Polygon
              key={`city-${group.key}`}
              positions={group.coords}
              pathOptions={{ color: '#a78bfa', weight: 1.5, opacity: 0.5, fillOpacity: 0.012, dashArray: '4 7' }}
            />
          ))}
          {activeUnlockedLayerIds.has('parcel-boundaries') && withCoords.map((prop, idx) => (
            <Rectangle
              key={`parcel-${idx}`}
              bounds={parcelBounds(Number(prop.Latitude), Number(prop.Longitude), 0.00022)}
              pathOptions={{ color: '#f59e0b', weight: 1.2, opacity: 0.75, fillOpacity: 0.025 }}
            />
          ))}
          {activeUnlockedLayerIds.has('fema-flood') && datasetBounds.length > 0 && (
            <Polygon
              positions={datasetBounds}
              pathOptions={{ color: '#38bdf8', weight: 1, opacity: 0.35, fillColor: '#0ea5e9', fillOpacity: 0.055 }}
            />
          )}
          {activeUnlockedLayerIds.has('zoning') && withCoords.map((prop, idx) => idx % 2 === 0 ? (
            <Rectangle
              key={`zoning-${idx}`}
              bounds={parcelBounds(Number(prop.Latitude), Number(prop.Longitude), 0.00045)}
              pathOptions={{ color: '#ec4899', weight: 0.8, opacity: 0.38, fillColor: '#ec4899', fillOpacity: 0.045 }}
            />
          ) : null)}
          {activeUnlockedLayerIds.has('off-market-candidates') && withCoords.map((prop, idx) => (
            <Circle
              key={`offmarket-${idx}`}
              center={[Number(prop.Latitude), Number(prop.Longitude)]}
              radius={85}
              pathOptions={{ color: '#f97316', weight: 1.2, opacity: 0.55, fillColor: '#f97316', fillOpacity: 0.07 }}
            />
          ))}

          {coords.length > 0 && <MapBoundsUpdater coords={coords} boundsKey={boundsKey} />}
          {withCoords.map((prop, idx) => {
            const fit = parseScore(prop.Fit_Score_0_to_100);
            const risk = parseScore(prop.Risk_Score_0_to_100);
            const pId = prop.Parcel_ID || prop.Property_Name_or_Address.replace(/\s+/g, '-');
            const isHovered = hoveredId === pId;

            return (
              <Marker
                key={idx}
                position={[+prop.Latitude, +prop.Longitude]}
                icon={createCustomIcon(fit, isHovered, pId)}
                eventHandlers={{
                  click: () => {
                    setPreviewProperty(prop);
                    handleMarkerClick(pId);
                  },
                  mouseover: () => {
                    setHoveredId(pId);
                    setPreviewProperty(prop);
                  },
                  mousemove: () => {
                    setHoveredId(pId);
                    setPreviewProperty(prop);
                  },
                  add: (event) => {
                    const marker = event.target;
                    marker.getElement()?.addEventListener('mouseenter', () => {
                      setHoveredId(pId);
                      setPreviewProperty(prop);
                    });
                  },
                  mouseout: () => {
                    setHoveredId(null);
                    if (shouldAutoHidePreview) setPreviewProperty(null);
                  }
                }}
              >
                <Popup maxWidth={320} className="property-preview-popup">
                  <div className="w-72 overflow-hidden rounded-xl bg-olive-950 text-white shadow-2xl">
                    {getSatelliteImageUrl(prop.Latitude, prop.Longitude, 18) && (
                      <img
                        src={getSatelliteImageUrl(prop.Latitude, prop.Longitude, 18) || ''}
                        alt={`Satellite view of ${displayValue(prop.Property_Name_or_Address)}`}
                        className="h-32 w-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="space-y-2 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm text-white leading-snug">
                            {displayValue(prop.Property_Name_or_Address)}
                          </h3>
                          <p className="mt-1 flex items-center gap-1 text-xs text-olive-400">
                            <MapPin size={11} /> {[prop.City, prop.County, 'GA'].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        {prop.Estimated_Price_or_Min_Bid && (
                          <span className="shrink-0 rounded-full bg-brand-900/70 px-2 py-1 text-[10px] font-bold text-brand-300">
                            {prop.Estimated_Price_or_Min_Bid}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className={`badge ${getFitScoreClass(fit)} text-xs`}>Fit: {fit || '–'}</span>
                        <span className={`badge ${getRiskScoreClass(risk)} text-xs`}>Risk: {risk || '–'}</span>
                        {prop.Lot_Size_Acres && <span className="badge bg-olive-800 border-olive-700 text-olive-200 text-xs">{prop.Lot_Size_Acres} ac</span>}
                      </div>
                      <button
                        onClick={() => onPropertyClick(prop)}
                        className="w-full mt-1 text-xs bg-green-700 hover:bg-brand-600 text-white rounded-lg py-2 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Cards Column */}
      <div className={`${isMapExpanded ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-visible pr-0 pb-8' : 'lg:w-[45%] xl:w-[40%] flex flex-col gap-4 overflow-y-auto pr-2 pb-4'} scroll-smooth`}>
        {properties.length === 0 ? (
          <div className="card text-olive-500 text-center py-10">No properties to display</div>
        ) : (
          properties.map((prop, idx) => {
            const pId = prop.Parcel_ID || prop.Property_Name_or_Address.replace(/\s+/g, '-');
            const isFav = favoriteIds.has(prop.Parcel_ID || prop.Property_Name_or_Address);
            return (
              <PropertyCard
                key={idx}
                id={`card-${pId}`}
                property={prop}
                onClick={() => onPropertyClick(prop)}
                isFavorite={isFav}
                onToggleFavorite={(e) => { e.stopPropagation(); onToggleFavorite(prop); }}
                isHovered={hoveredId === pId}
                onMouseEnter={() => setHoveredId(pId)}
                onMouseLeave={() => setHoveredId(null)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
