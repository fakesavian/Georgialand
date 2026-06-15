import React from 'react';
import { ExternalLink, MapPin, AlertCircle, Lock, AlertTriangle } from 'lucide-react';
import { LandProperty } from '../../types';
import { trackEvent } from '../../lib/analytics';
import { isValidUrl, displayValue, getFitScoreClass, getRiskScoreClass, parseScore, getProList, getConsList, getPropertyWarnings, getSatelliteImageUrl, getStreetContextImageUrl, getGoogleStreetViewEmbedUrl, getGoogleMapsEmbedUrl } from '../../utils';
import MediaLightbox, { PropertyMediaItem } from './MediaLightbox';

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
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
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
    <div className="property-field-row flex gap-2 py-1.5 border-b border-surface-border/60">
      <span className="property-field-label text-xs text-olive-500 w-40 shrink-0">{label}</span>
      <span className="property-field-value text-xs text-olive-100 flex-1 break-words">
        {value || <span className="text-olive-600 italic">Needs verification</span>}
      </span>
    </div>
  );
}

function MediaFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[118px] flex-col items-center justify-center bg-gradient-to-br from-olive-900 to-olive-950 text-center text-olive-600">
      <MapPin size={20} className="mb-2 opacity-40" />
      <span className="text-xs">{label}</span>
    </div>
  );
}

function PropertyMediaTile({ item, onSelect }: { item: PropertyMediaItem; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group overflow-hidden rounded-xl border border-olive-800 bg-olive-900 text-left shadow-inner transition hover:border-brand-500 hover:shadow-[0_0_18px_rgba(34,197,94,0.22)]"
      aria-label={`Enlarge ${item.label}`}
    >
      <div className="relative h-24 sm:h-32">
        {item.thumbnailSrc ? (
          item.thumbnailKind === 'image' ? (
            <img src={item.thumbnailSrc} alt={item.title} className="h-full w-full object-cover transition duration-200 group-hover:scale-105" loading="lazy" />
          ) : (
            <iframe
              src={item.thumbnailSrc}
              title={`${item.title} preview`}
              className="pointer-events-none h-full w-full border-0"
              loading="lazy"
              tabIndex={-1}
              aria-hidden="true"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )
        ) : (
          <MediaFallback label="Location unavailable" />
        )}
        <figcaption className="absolute bottom-0 left-0 right-0 bg-black/55 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">{item.label}</figcaption>
      </div>
    </button>
  );
}

function buildPropertyMediaItems(property: LandProperty): PropertyMediaItem[] {
  const locationQuery = [property.Property_Name_or_Address, property.City, property.County, 'GA'].filter(Boolean).join(', ');
  const skyView = getSatelliteImageUrl(property.Latitude, property.Longitude, 16);
  const closeUpView = getSatelliteImageUrl(property.Latitude, property.Longitude, 19);
  const streetContext = getStreetContextImageUrl(property.Latitude, property.Longitude, 18);
  const streetView = getGoogleStreetViewEmbedUrl(property.Latitude, property.Longitude) || getGoogleMapsEmbedUrl(locationQuery, 'street', 18);
  const skyEmbed = getGoogleMapsEmbedUrl(locationQuery, 'satellite', 16);
  const closeUpEmbed = getGoogleMapsEmbedUrl(locationQuery, 'satellite', 20);
  return [
    {
      id: 'sky',
      label: 'Sky View',
      title: `Sky view of ${displayValue(property.Property_Name_or_Address)}`,
      thumbnailKind: skyView ? 'image' : 'frame',
      thumbnailSrc: skyView || skyEmbed,
      fullKind: skyView ? 'image' : 'frame',
      fullSrc: skyView || skyEmbed,
    },
    {
      id: 'close',
      label: 'Close-Up',
      title: `Close-up view of ${displayValue(property.Property_Name_or_Address)}`,
      thumbnailKind: closeUpView ? 'image' : 'frame',
      thumbnailSrc: closeUpView || closeUpEmbed,
      fullKind: closeUpView ? 'image' : 'frame',
      fullSrc: closeUpView || closeUpEmbed,
    },
    {
      id: 'street',
      label: 'Street View',
      title: `Street view near ${displayValue(property.Property_Name_or_Address)}`,
      thumbnailKind: streetContext ? 'image' : 'frame',
      thumbnailSrc: streetContext || streetView,
      fullKind: 'frame',
      fullSrc: streetView || streetContext,
    },
  ];
}

function PropertyMediaGallery({ property, onOpen }: { property: LandProperty; onOpen: (index: number) => void }) {
  const mediaItems = buildPropertyMediaItems(property);

  return (
    <div className="border-b border-surface-border bg-olive-950/70 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-olive-400">Property Images</p>
        <p className="text-[10px] text-olive-600">Tap to enlarge</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {mediaItems.map((item, index) => <PropertyMediaTile key={item.id} item={item} onSelect={() => onOpen(index)} />)}
      </div>
    </div>
  );
}

function getSourceEvidence(property: LandProperty) {
  const hasCoordinates = Boolean(property.Latitude && property.Longitude && !Number.isNaN(Number(property.Latitude)) && !Number.isNaN(Number(property.Longitude)));
  const checks = [
    { label: 'Official/source listing', ok: isValidUrl(property.Source_URL), detail: property.Source_Agency || property.Source_Name || property.Source_URL || 'Missing source URL' },
    { label: 'Property page', ok: isValidUrl(property.Property_Page_URL), detail: property.Property_Page_URL || 'Missing property page URL' },
    { label: 'GIS / assessor cross-check', ok: isValidUrl(property.GIS_URL), detail: property.GIS_URL || 'Missing GIS or assessor link' },
    { label: 'Map / geocode check', ok: isValidUrl(property.Map_URL) || hasCoordinates, detail: hasCoordinates ? `${property.Latitude}, ${property.Longitude}` : property.Map_URL || 'Missing coordinates and map URL' },
    { label: 'Parcel identifier', ok: Boolean(property.Parcel_ID), detail: property.Parcel_ID || 'Parcel ID missing' },
    { label: 'Data confidence score', ok: Number(property.Data_Confidence_0_to_100 || 0) >= 70, detail: property.Data_Confidence_0_to_100 ? `${property.Data_Confidence_0_to_100}/100` : 'No confidence score' },
  ];
  const verifiedCount = checks.filter((check) => check.ok).length;
  const blackSpots = checks.filter((check) => !check.ok).map((check) => check.label);
  return { checks, verifiedCount, blackSpots };
}

function SourceVerificationPanel({ property }: { property: LandProperty }) {
  const evidence = getSourceEvidence(property);
  return (
    <div className="rounded-lg border border-surface-border bg-olive-950/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-olive-400">Source Verification</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${evidence.blackSpots.length === 0 ? 'bg-brand-900/60 text-brand-300' : 'bg-amber-950/70 text-amber-300'}`}>
          {evidence.verifiedCount}/{evidence.checks.length} backed
        </span>
      </div>
      <div className="grid gap-1.5">
        {evidence.checks.map((check) => (
          <div key={check.label} className="flex items-start gap-2 rounded-md border border-olive-900 bg-olive-900/35 px-2 py-1.5">
            <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${check.ok ? 'bg-brand-400' : 'bg-amber-400'}`} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-olive-100">{check.label}</p>
              <p className="truncate text-[11px] text-olive-500" title={check.detail}>{check.detail}</p>
            </div>
          </div>
        ))}
      </div>
      {evidence.blackSpots.length > 0 && (
        <p className="mt-2 text-xs text-amber-300">
          Black spots to verify: {evidence.blackSpots.join(', ')}.
        </p>
      )}
    </div>
  );
}

export default function PropertyDrawer({
  property, onClose, isFavorite, onToggleFavorite, note, onNoteChange,
}: PropertyDrawerProps) {
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    setLightboxIndex(null);
  }, [property?.Listing_ID, property?.Parcel_ID, property?.Property_Name_or_Address]);

  if (!property) return null;

  const fit = parseScore(property.Fit_Score_0_to_100);
  const risk = parseScore(property.Risk_Score_0_to_100);
  const pros = getProList(property.Pros);
  const cons = getConsList(property.Cons);
  const mediaItems = buildPropertyMediaItems(property);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[990]"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="property-drawer-shell fixed right-0 top-0 h-full w-full max-w-lg bg-olive-950 border-l border-surface-border z-[1000] flex flex-col animate-slide-in-right">
        {/* Drawer header — stays visible; close/favorite always reachable */}
        <div className="property-drawer-header flex items-start justify-between p-4 border-b border-surface-border gap-3">
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

        {/* Single scroll region — header above stays fixed so close/favorite are always reachable */}
        <div className="property-drawer-scroll flex-1 overflow-y-auto">
        {/* Score pills */}
        <div className="property-drawer-badges flex gap-3 px-4 py-3 border-b border-surface-border">
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
        <div className="property-drawer-actions grid grid-cols-2 gap-2 px-4 py-3 border-b border-surface-border sm:flex sm:flex-wrap">
          <UrlButton url={property.Source_URL} label="Source" onClick={() => trackEvent('Engagement', 'source_link_click', property.Property_Name_or_Address)} />
          <UrlButton url={property.Property_Page_URL} label="Property Page" />
          <UrlButton url={property.Map_URL} label="Map" icon={<MapPin size={11} />} onClick={() => trackEvent('Engagement', 'map_link_click', property.Property_Name_or_Address)} />
          <UrlButton url={property.GIS_URL} label="GIS" />
        </div>

        <PropertyMediaGallery property={property} onOpen={setLightboxIndex} />

        {/* Detail content */}
        <div className="p-4 space-y-5">
          <SourceVerificationPanel property={property} />

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

          {/* All fields — collapsed by default so the key detail above is reachable */}
          <details className="property-more-details">
            <summary className="property-more-details__summary flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-surface-border bg-olive-900/50 px-3 py-2 text-xs font-medium uppercase tracking-wider text-olive-300 hover:text-white">
              <span>More details — all source fields</span>
              <span className="text-olive-500">{Object.keys(property).length} fields</span>
            </summary>
            <div className="mt-3 space-y-0">
              {Object.entries(property).map(([key, val]) => (
                <FieldRow key={key} label={key.replace(/_/g, ' ')} value={val} />
              ))}
            </div>
          </details>

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
        </div>
      </aside>

      {lightboxIndex !== null && (
        <MediaLightbox
          items={mediaItems}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </>
  );
}
