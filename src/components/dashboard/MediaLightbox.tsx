import React from 'react';
import { ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';

export type PropertyMediaItem = {
  id: 'sky' | 'close' | 'street';
  label: string;
  title: string;
  thumbnailKind: 'image' | 'frame';
  thumbnailSrc: string | null;
  fullKind: 'image' | 'frame';
  fullSrc: string | null;
};

interface MediaLightboxProps {
  items: PropertyMediaItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

/**
 * Full-screen image/map viewer that works on mobile AND desktop. Renders above
 * the property drawer, supports tap-backdrop / X / Esc to close, prev/next with
 * buttons + arrow keys, and fails gracefully on missing/broken media.
 */
export default function MediaLightbox({ items, index, onClose, onIndexChange }: MediaLightboxProps) {
  const [failed, setFailed] = React.useState(false);
  const item = items[index];
  const hasMultiple = items.length > 1;

  const go = React.useCallback(
    (delta: number) => {
      if (items.length < 2) return;
      onIndexChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onIndexChange],
  );

  React.useEffect(() => {
    setFailed(false);
  }, [index, item?.fullSrc]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  if (!item) return null;

  return (
    <div
      className="media-lightbox fixed inset-0 z-[1100] flex flex-col bg-black/92 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={onClose}
    >
      <div
        className="media-lightbox__head flex items-start justify-between gap-3 px-4 pb-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-brand-300">{item.label}</p>
          <p className="truncate text-sm text-olive-200">{item.title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
          aria-label="Close image viewer"
        >
          <X size={18} />
        </button>
      </div>

      <div
        className="media-lightbox__stage relative flex min-h-0 flex-1 items-center justify-center px-3"
        onClick={(e) => e.stopPropagation()}
      >
        {item.fullSrc && !failed ? (
          item.fullKind === 'image' ? (
            <img
              src={item.fullSrc}
              alt={item.title}
              className="max-h-full max-w-full object-contain"
              onError={() => setFailed(true)}
            />
          ) : (
            <iframe
              src={item.fullSrc}
              title={item.title}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center text-olive-400">
            <MapPin size={28} className="mb-2 opacity-50" />
            <span className="text-sm">Image unavailable</span>
          </div>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/50 text-white hover:bg-black/70"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/50 text-white hover:bg-black/70"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="media-lightbox__dots flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          {items.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onIndexChange(i)}
              aria-label={`Show ${m.label}`}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-emerald-400' : 'w-2 bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
