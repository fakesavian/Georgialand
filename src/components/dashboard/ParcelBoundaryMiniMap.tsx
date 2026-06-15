import React from 'react';
import { MapContainer, TileLayer, GeoJSON as LeafletGeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Small satellite map that draws the SAME verified red parcel boundary used on the
 * main map. Rendered only when real GeoJSON geometry exists — it never fabricates a
 * boundary on top of a static photo.
 */
function FitToGeometry({ geometry }: { geometry: Record<string, any> }) {
  const map = useMap();
  React.useEffect(() => {
    try {
      const layer = L.geoJSON({ type: 'Feature', geometry, properties: {} } as never);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [18, 18], maxZoom: 19, animate: false });
      }
      window.setTimeout(() => map.invalidateSize(), 120);
    } catch {
      /* ignore — bad geometry simply leaves the default view */
    }
  }, [geometry, map]);
  return null;
}

export default function ParcelBoundaryMiniMap({ geometry }: { geometry: Record<string, any> }) {
  return (
    <MapContainer
      center={[32.95, -83.45]}
      zoom={17}
      zoomControl={false}
      attributionControl={false}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
        maxZoom={19}
        maxNativeZoom={18}
      />
      <LeafletGeoJSON
        data={{ type: 'Feature', geometry, properties: {} } as never}
        style={() => ({ color: '#ef4444', weight: 3, opacity: 1, fillColor: '#ef4444', fillOpacity: 0.1, className: 'verified-parcel-boundary-red' })}
      />
      <FitToGeometry geometry={geometry} />
    </MapContainer>
  );
}
