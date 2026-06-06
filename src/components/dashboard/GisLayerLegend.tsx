import React from 'react';
import { GisLayerConfig } from '../../types/gis';

interface GisLayerLegendProps {
  layers: GisLayerConfig[];
  activeLayerIds: Set<string>;
}

export default function GisLayerLegend({ layers, activeLayerIds }: GisLayerLegendProps) {
  const active = layers.filter((layer) => activeLayerIds.has(layer.id));
  if (!active.length) return null;

  return (
    <div className="absolute bottom-3 left-3 z-[500] rounded-xl border border-surface-border bg-olive-950/90 p-3 text-xs shadow-xl backdrop-blur">
      <div className="mb-2 font-bold uppercase tracking-wider text-olive-300">Legend</div>
      <div className="space-y-1.5">
        {active.map((layer) => (
          <div key={layer.id} className="flex items-center gap-2 text-olive-300">
            <span className="h-2.5 w-2.5 rounded-full border border-white/40" style={{ backgroundColor: layer.color, opacity: layer.opacity ?? 1 }} />
            <span>{layer.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
