import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
const { BaseLayer } = LayersControl;
import { LandProperty } from '../../types';
import PropertyCard from './PropertyCard';
import { parseScore, getFitScoreClass, getRiskScoreClass, isValidUrl, displayValue } from '../../utils';

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createCustomIcon(fit: number, isHovered: boolean = false) {
  const color = fit >= 70 ? '#22c55e' : fit >= 40 ? '#eab308' : '#6b7280';
  const scale = isHovered ? 'scale(1.2)' : 'scale(1)';
  const zIndex = isHovered ? 1000 : 0;
  
  return L.divIcon({
    html: `<div style="
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
}

function MapBoundsUpdater({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      map.fitBounds(coords, { padding: [40, 40], maxZoom: 13 });
    }
  }, [coords, map]);
  return null;
}

export default function MapView({ properties, onPropertyClick, favoriteIds, onToggleFavorite }: MapViewProps) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const withCoords = properties.filter(
    p => p.Latitude && p.Longitude && !isNaN(+p.Latitude) && !isNaN(+p.Longitude)
  );

  const coords: [number, number][] = withCoords.map(p => [+p.Latitude, +p.Longitude]);

  const handleMarkerClick = (id: string) => {
    const el = document.getElementById(`card-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-180px)] min-h-[600px]">
      {/* Map Column */}
      <div className="flex-1 lg:w-[55%] xl:w-[60%] rounded-xl overflow-hidden border border-surface-border relative z-10 shrink-0">
        <MapContainer
          center={[33.749, -84.388]}
          zoom={9}
          style={{ height: '100%', width: '100%' }}
        >
          <LayersControl position="topright">
            <BaseLayer checked name="Dark Road">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
            </BaseLayer>
            <BaseLayer name="Light Road">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
            </BaseLayer>
            <BaseLayer name="Satellite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri"
              />
            </BaseLayer>
            <BaseLayer name="Topographic">
              <TileLayer
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                attribution='Map data: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
              />
            </BaseLayer>
          </LayersControl>
          {coords.length > 0 && <MapBoundsUpdater coords={coords} />}
          {withCoords.map((prop, idx) => {
            const fit = parseScore(prop.Fit_Score_0_to_100);
            const risk = parseScore(prop.Risk_Score_0_to_100);
            const pId = prop.Parcel_ID || prop.Property_Name_or_Address.replace(/\\s+/g, '-');
            const isHovered = hoveredId === pId;

            return (
              <Marker
                key={idx}
                position={[+prop.Latitude, +prop.Longitude]}
                icon={createCustomIcon(fit, isHovered)}
                eventHandlers={{
                  click: () => handleMarkerClick(pId),
                  mouseover: () => setHoveredId(pId),
                  mouseout: () => setHoveredId(null)
                }}
              >
                <Popup maxWidth={280}>
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-white leading-snug">
                      {displayValue(prop.Property_Name_or_Address)}
                    </h3>
                    <p className="text-xs text-olive-400">
                      {[prop.City, prop.County, 'GA'].filter(Boolean).join(', ')}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <span className={`badge \${getFitScoreClass(fit)} text-xs`}>Fit: {fit || '–'}</span>
                      <span className={`badge \${getRiskScoreClass(risk)} text-xs`}>Risk: {risk || '–'}</span>
                    </div>
                    {prop.Price_Category && (
                      <p className="text-xs text-olive-200">
                        <span className="text-olive-500">Price: </span>{prop.Estimated_Price_or_Min_Bid || prop.Price_Category}
                      </p>
                    )}
                    <button
                      onClick={() => onPropertyClick(prop)}
                      className="w-full mt-1 text-xs bg-green-700 hover:bg-brand-600 text-white rounded-lg py-1.5 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Cards Column */}
      <div className="lg:w-[45%] xl:w-[40%] flex flex-col gap-4 overflow-y-auto pr-2 pb-4 scroll-smooth">
        {properties.length === 0 ? (
          <div className="card text-olive-500 text-center py-10">No properties to display</div>
        ) : (
          properties.map((prop, idx) => {
            const pId = prop.Parcel_ID || prop.Property_Name_or_Address.replace(/\\s+/g, '-');
            const isFav = favoriteIds.has(prop.Parcel_ID || prop.Property_Name_or_Address);
            return (
              <PropertyCard
                key={idx}
                id={`card-\${pId}`}
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
