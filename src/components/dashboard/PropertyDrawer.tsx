import React from 'react';
import { ExternalLink, MapPin, AlertCircle, Lock, AlertTriangle } from 'lucide-react';
import { LandProperty } from '../../types';
import { trackEvent } from '../../lib/analytics';
import { isValidUrl, displayValue, getFitScoreClass, getRiskScoreClass, parseScore, getProList, getConsList, getPropertyWarnings } from '../../utils';

interface PropertyDrawerProps {
  property: LandProperty | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (p: LandProperty) => void;
  note: string;
  onNoteChange: (parcelId: string, note: string) => void;
}

function UrlButton({ url, label, icon, onClick }: { url: string; label: string; icon?: React.ReactNode; onClick?: () => void }) {
  const valid = isValidUrl(url);
  return (
    <a
      href={valid ? url : undefined}
      target={valid ? '_blank' : undefined}
      rel="noopener noreferrer"
      onClick={e => {
        if (!valid) e.preventDefault();
        else if (onClick) onClick();
      }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        valid
          ? 'bg-green-900/40 border-green-700 text-green-300 hover:bg-green-800/60 hover:border-brand-500 cursor-pointer'
          : 'bg-olive-800 border-olive-700 text-olive-600 cursor-not-allowed opacity-60'
      }`}
    >
      {valid ? (icon || <ExternalLink size={11} />) : <Lock size={11} />}
      {label}
    </a>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-surface-border/60">
      <span className="text-xs text-olive-500 w-40 shrink-0">{label}</span>
      <span className="text-xs text-olive-100 flex-1 break-words">
        {value || <span className="text-olive-600 italic">Needs verification</span>}
      </span>
    </div>
  );
}

export default function PropertyDrawer({
  property, onClose, isFavorite, onToggleFavorite, note, onNoteChange,
}: PropertyDrawerProps) {
  if (!property) return null;

  const fit = parseScore(property.Fit_Score_0_to_100);
  const risk = parseScore(property.Risk_Score_0_to_100);
  const pros = getProList(property.Pros);
  const cons = getConsList(property.Cons);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-lg bg-olive-950 border-l border-surface-border z-50 flex flex-col animate-slide-in-right overflow-hidden">
        {/* Drawer header */}
        <div className="flex items-start justify-between p-4 border-b border-surface-border gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-medium text-white leading-snug">
              {displayValue(property.Property_Name_or_Address)}
            </h2>
            <p className="text-xs text-olive-500 mt-0.5 flex items-center gap-1">
              <MapPin size={10} />
              {[property.City, property.County, 'GA'].filter(Boolean).join(', ')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleFavorite(property)}
              className={`p-1.5 rounded-lg border transition-all ${
                isFavorite
                  ? 'bg-red-900/40 border-red-700 text-accent-danger'
                  : 'bg-olive-800 border-olive-700 text-olive-500 hover:text-accent-danger'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              ♥
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-olive-800 border border-olive-700 text-olive-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Score pills */}
        <div className="flex gap-3 px-4 py-3 border-b border-surface-border">
          <div className={`badge ${getFitScoreClass(fit)} text-sm font-medium px-3 py-1`}>
            Fit: {fit || 'N/A'}
          </div>
          <div className={`badge ${getRiskScoreClass(risk)} text-sm font-medium px-3 py-1`}>
            Risk: {risk || 'N/A'}
          </div>
          {property.Price_Category && (
            <div className="badge bg-olive-800 text-olive-200 border border-olive-700 text-sm px-3 py-1">
              {property.Price_Category}
            </div>
          )}
          {property.Acquisition_Type && (
            <div className="badge bg-blue-900/40 text-blue-300 border border-blue-800 text-sm px-3 py-1">
              {property.Acquisition_Type}
            </div>
          )}
        </div>

        {/* URL buttons */}
        <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-surface-border">
          <UrlButton url={property.Source_URL} label="Source" onClick={() => trackEvent('Engagement', 'source_link_click', property.Property_Name_or_Address)} />
          <UrlButton url={property.Property_Page_URL} label="Property Page" />
          <UrlButton url={property.Map_URL} label="Map" icon={<MapPin size={11} />} onClick={() => trackEvent('Engagement', 'map_link_click', property.Property_Name_or_Address)} />
          <UrlButton url={property.GIS_URL} label="GIS" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Data Quality Warnings */}
          {getPropertyWarnings(property).length > 0 && (
            <div className="bg-orange-950/20 border border-orange-850 rounded-lg p-3">
              <p className="text-xs text-orange-400 font-medium mb-1 flex items-center gap-1">
                <AlertTriangle size={12} /> Data Quality Warnings
              </p>
              <ul className="list-disc list-inside text-xs text-orange-300/90 space-y-0.5">
                {getPropertyWarnings(property).map((w: any, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Action */}
          {property.Recommended_Next_Action && (
            <div className="bg-green-900/20 border border-brand-800 rounded-lg p-3">
              <p className="text-xs text-brand-400 font-medium mb-1 flex items-center gap-1">
                <AlertCircle size={12} /> Recommended Action
              </p>
              <p className="text-sm text-green-200">{property.Recommended_Next_Action}</p>
            </div>
          )}

          {/* Pros & Cons */}
          {(pros.length > 0 || cons.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {pros.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-brand-400 mb-2">✓ Pros</p>
                  <ul className="space-y-1">
                    {pros.map((p: any, i: number) => (
                      <li key={i} className="text-xs text-olive-200 flex items-start gap-1.5">
                        <span className="text-brand-500 mt-0.5 shrink-0">•</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {cons.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-accent-danger mb-2">✕ Cons</p>
                  <ul className="space-y-1">
                    {cons.map((c: any, i: number) => (
                      <li key={i} className="text-xs text-olive-200 flex items-start gap-1.5">
                        <span className="text-accent-danger mt-0.5 shrink-0">•</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* All fields */}
          <div>
            <p className="text-xs font-medium text-olive-400 mb-2 uppercase tracking-wider">All Fields</p>
            <div className="space-y-0">
              {Object.entries(property).map(([key, val]) => (
                <FieldRow key={key} label={key.replace(/_/g, ' ')} value={val} />
              ))}
            </div>
          </div>

          {/* Personal notes */}
          <div>
            <p className="text-xs font-medium text-olive-400 mb-2 uppercase tracking-wider">My Notes</p>
            <textarea
              value={note}
              onChange={e => onNoteChange(property.Parcel_ID || property.Property_Name_or_Address, e.target.value)}
              placeholder="Add personal notes for this property..."
              rows={4}
              className="input w-full text-sm resize-none"
            />
            <p className="text-xs text-olive-600 mt-1">Notes are saved automatically in your browser.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
