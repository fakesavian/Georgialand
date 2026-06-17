import React from 'react';
import { ChevronDown, ChevronUp, Clock, Lock, SlidersHorizontal, X } from 'lucide-react';
import { AccessLevel } from '../../lib/authTypes';
import { canAccessGisLayer, isLayerDataAvailable } from '../../lib/gisLayers';
import { GisLayerConfig } from '../../types/gis';

interface MapLayerControlProps {
  layers: GisLayerConfig[];
  activeLayerIds: Set<string>;
  accessLevel: AccessLevel;
  baseMapId: string;
  onBaseMapChange: (baseMapId: string) => void;
  onToggleLayer: (layerId: string) => void;
  onClose?: () => void;
}

const BASE_MAP_OPTIONS = [
  { id: 'satellite', name: 'Satellite + Labels', description: 'Aerial imagery with place labels' },
  { id: 'topographic', name: 'Topographic Info', description: 'Terrain, contours, trails, landform context' },
  { id: 'light', name: 'Light Parcel Map', description: 'Street-forward parcel browsing' },
  { id: 'dark', name: 'Dark Analysis', description: 'High-contrast analysis base' },
];

export default function MapLayerControl({ layers, activeLayerIds, accessLevel, baseMapId, onBaseMapChange, onToggleLayer, onClose }: MapLayerControlProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-surface-border bg-olive-950/95 p-3 shadow-xl backdrop-blur">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg bg-olive-900/70 px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-olive-200 transition-colors hover:text-white"
          aria-expanded={!isCollapsed}
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-brand-400" /> GIS Layers
          </span>
          <span className="flex items-center gap-1 text-[10px] text-olive-500">
            {isCollapsed ? 'Show' : 'Hide'}
            {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </span>
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-olive-800 bg-olive-900/70 p-2 text-olive-300 transition hover:border-brand-500 hover:text-white"
            aria-label="Close GIS layers panel"
            title="Back to insights"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {!isCollapsed && <div className="mt-2 max-h-[min(46vh,28rem)] space-y-3 overflow-y-auto pr-1">
        <div className="rounded-lg border border-olive-800 bg-olive-900/55 p-2">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-300">Base Map</p>
          <div className="grid gap-2">
            {BASE_MAP_OPTIONS.map((option) => {
              const checked = baseMapId === option.id;
              return (
                <label key={option.id} className={`flex cursor-pointer items-start gap-2 rounded-lg border px-2 py-2 text-xs transition ${checked ? 'border-brand-500 bg-brand-900/35 text-white' : 'border-olive-800 bg-olive-950/55 text-olive-200 hover:border-olive-600'}`}>
                  <input
                    type="radio"
                    name="glf-base-map"
                    checked={checked}
                    onChange={() => onBaseMapChange(option.id)}
                    className="mt-0.5 border-olive-700 bg-olive-900 text-brand-600 focus:ring-brand-600"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 font-semibold">
                      <span>{option.name}</span>
                      {checked && <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-brand-200">Active</span>}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-olive-500">{option.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
        <div className="rounded-lg border border-olive-800 bg-olive-900/55 p-2">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-300">GIS Overlays</p>
          <div className="space-y-2">
        {layers.map((layer) => {
          const unlocked = canAccessGisLayer(layer, accessLevel);
          const dataAvailable = isLayerDataAvailable(layer);
          // A layer is "coming soon" once it's tier-unlocked but has no real data wired yet.
          const comingSoon = unlocked && !dataAvailable;
          const checked = activeLayerIds.has(layer.id);
          const description = !unlocked
            ? (layer.lockedDescription || 'Upgrade required')
            : !dataAvailable
              ? (layer.dataStatusNote || 'Data source not yet connected.')
              : (layer.dataStatusNote || layer.attribution || 'Source attribution pending');
          return (
            <label key={layer.id} className={`flex items-start gap-2 rounded-lg border px-2 py-2 text-xs ${unlocked && dataAvailable ? 'border-olive-800 bg-olive-900/70 text-olive-200' : 'border-olive-900 bg-olive-900/35 text-olive-500'}`}>
              <input
                type="checkbox"
                checked={checked && dataAvailable}
                disabled={!unlocked || layer.type === 'property_pins' || !dataAvailable}
                onChange={() => onToggleLayer(layer.id)}
                className="mt-0.5 rounded bg-olive-900 border-olive-700 text-brand-600 focus:ring-brand-600 disabled:opacity-40"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2 font-semibold">
                  <span>{layer.name}</span>
                  {!unlocked ? (
                    <Lock size={12} className="shrink-0 text-accent-warning" />
                  ) : comingSoon ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-olive-700 bg-olive-900 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-olive-400">
                      <Clock size={9} /> Coming soon
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-[10px] leading-snug text-olive-500">
                  {description}
                </span>
              </span>
            </label>
          );
        })}
          </div>
        </div>
      </div>}
    </div>
  );
}
