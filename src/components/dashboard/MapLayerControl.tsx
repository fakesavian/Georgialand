import React from 'react';
import { ChevronDown, ChevronUp, Lock, SlidersHorizontal } from 'lucide-react';
import { AccessLevel } from '../../lib/authTypes';
import { canAccessGisLayer } from '../../lib/gisLayers';
import { GisLayerConfig } from '../../types/gis';

interface MapLayerControlProps {
  layers: GisLayerConfig[];
  activeLayerIds: Set<string>;
  accessLevel: AccessLevel;
  onToggleLayer: (layerId: string) => void;
}

export default function MapLayerControl({ layers, activeLayerIds, accessLevel, onToggleLayer }: MapLayerControlProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className="absolute left-3 top-3 z-[500] w-72 max-w-[calc(100%-1.5rem)] rounded-xl border border-surface-border bg-olive-950/95 p-3 shadow-2xl backdrop-blur">
      <button
        type="button"
        onClick={() => setIsCollapsed((value) => !value)}
        className="flex w-full items-center justify-between gap-2 text-left text-xs font-bold uppercase tracking-wider text-olive-200 hover:text-white transition-colors"
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
      {!isCollapsed && <div className="mt-2 space-y-2">
        {layers.map((layer) => {
          const unlocked = canAccessGisLayer(layer, accessLevel);
          const checked = activeLayerIds.has(layer.id);
          return (
            <label key={layer.id} className={`flex items-start gap-2 rounded-lg border px-2 py-2 text-xs ${unlocked ? 'border-olive-800 bg-olive-900/70 text-olive-200' : 'border-olive-900 bg-olive-900/35 text-olive-500'}`}>
              <input
                type="checkbox"
                checked={checked}
                disabled={!unlocked || layer.type === 'property_pins'}
                onChange={() => onToggleLayer(layer.id)}
                className="mt-0.5 rounded bg-olive-900 border-olive-700 text-brand-600 focus:ring-brand-600 disabled:opacity-40"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2 font-semibold">
                  <span>{layer.name}</span>
                  {!unlocked && <Lock size={12} className="shrink-0 text-accent-warning" />}
                </span>
                <span className="mt-0.5 block text-[10px] leading-snug text-olive-500">
                  {unlocked ? (layer.attribution || 'Source attribution pending') : (layer.lockedDescription || 'Upgrade required')}
                </span>
              </span>
            </label>
          );
        })}
      </div>}
    </div>
  );
}
