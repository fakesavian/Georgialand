import { useState, useMemo, useCallback } from 'react';
import { LandProperty, Favorite } from '../types';
import { trackEvent } from './analytics';

const LS_FAVORITES = 'glf_favorites';
const LS_NOTES = 'glf_notes';

function loadFromLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function saveToLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export interface UseFavoritesResult {
  favorites: Favorite[];
  notes: Record<string, string>;
  favoriteIds: Set<string>;
  toggleFavorite: (prop: LandProperty) => void;
  removeFavorite: (id: string) => void;
  setNote: (id: string, text: string) => void;
  /**
   * Whether favorites are persisted to the authenticated user's account
   * (synced across devices) vs. stored only in this browser's localStorage.
   *
   * Currently always `false`: no `saved_listings` table exists in Supabase yet.
   * See `supabase/saved_listings_schema.sql` (proposal) and docs/BLOCKERS.md.
   * When the table + RLS policies are live, this hook is the single seam where
   * the remote read/write path is added — the DashboardPage API stays the same.
   */
  isAccountBacked: boolean;
}

/**
 * Favorites + notes persistence for the dashboard.
 *
 * Today this is device-scoped (localStorage). The hook is intentionally the
 * only place that knows how favorites are stored, so account-backed sync can
 * be dropped in later without touching DashboardPage or FavoritesView.
 */
export function useFavorites(): UseFavoritesResult {
  const [favorites, setFavorites] = useState<Favorite[]>(() => loadFromLS(LS_FAVORITES, []));
  const [notes, setNotes] = useState<Record<string, string>>(() => loadFromLS(LS_NOTES, {}));

  const favoriteIds = useMemo(() => new Set(favorites.map(f => f.parcelId)), [favorites]);

  const toggleFavorite = useCallback((prop: LandProperty) => {
    const id = prop.Parcel_ID || prop.Property_Name_or_Address;
    setFavorites(prev => {
      const exists = prev.find(f => f.parcelId === id);
      const next = exists
        ? prev.filter(f => f.parcelId !== id)
        : [...prev, {
          parcelId: id,
          address: prop.Property_Name_or_Address,
          notes: '',
          addedAt: new Date().toISOString(),
        }];
      if (!exists) trackEvent('Engagement', 'favorite_saved', prop.Property_Name_or_Address);
      saveToLS(LS_FAVORITES, next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.parcelId !== id);
      saveToLS(LS_FAVORITES, next);
      return next;
    });
  }, []);

  const setNote = useCallback((id: string, text: string) => {
    setNotes(prev => {
      const next = { ...prev, [id]: text };
      saveToLS(LS_NOTES, next);
      return next;
    });
  }, []);

  return {
    favorites,
    notes,
    favoriteIds,
    toggleFavorite,
    removeFavorite,
    setNote,
    isAccountBacked: false,
  };
}
