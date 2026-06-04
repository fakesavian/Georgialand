import React from 'react';
import { Heart, Trash2, ExternalLink } from 'lucide-react';
import { LandProperty, Favorite } from '../../types';
import { getFitScoreClass, getRiskScoreClass, parseScore, displayValue, isValidUrl, exportToCSV } from '../../utils';

interface FavoritesViewProps {
  properties: LandProperty[];
  favorites: Favorite[];
  notes: Record<string, string>;
  onRowClick: (p: LandProperty) => void;
  onRemoveFavorite: (id: string) => void;
}

export default function FavoritesView({
  properties, favorites, notes, onRowClick, onRemoveFavorite,
}: FavoritesViewProps) {
  const favoriteIds = new Set(favorites.map(f => f.parcelId));
  const favProperties = properties.filter(p => {
    const id = p.Parcel_ID || p.Property_Name_or_Address;
    return favoriteIds.has(id);
  });

  const handleExport = () => {
    exportToCSV(favProperties, 'georgia-land-favorites.csv');
  };

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <Heart size={40} className="text-gray-800" />
        <p className="text-olive-500 font-medium">No favorites yet</p>
        <p className="text-gray-700 text-sm">Click the ♥ icon on any property to save it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">
          <Heart size={18} className="text-accent-danger fill-red-400" />
          Saved Favorites
          <span className="badge bg-red-900/40 text-accent-danger border border-accent-danger/40">{favorites.length}</span>
        </h2>
        <button onClick={handleExport} className="btn-ghost text-xs">
          <ExternalLink size={13} /> Export Favorites CSV
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="px-4 py-2.5 text-left text-olive-500 font-medium">Address</th>
              <th className="px-4 py-2.5 text-left text-olive-500 font-medium">City/County</th>
              <th className="px-4 py-2.5 text-left text-olive-500 font-medium">Type</th>
              <th className="px-4 py-2.5 text-left text-olive-500 font-medium">Price</th>
              <th className="px-4 py-2.5 text-left text-olive-500 font-medium">Fit</th>
              <th className="px-4 py-2.5 text-left text-olive-500 font-medium">Risk</th>
              <th className="px-4 py-2.5 text-left text-olive-500 font-medium">My Notes</th>
              <th className="px-4 py-2.5 text-left text-olive-500 font-medium">Added</th>
              <th className="px-4 py-2.5 text-left text-olive-500 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {favorites.map(fav => {
              const prop = favProperties.find(p => (p.Parcel_ID || p.Property_Name_or_Address) === fav.parcelId);
              const fit = prop ? parseScore(prop.Fit_Score_0_to_100) : 0;
              const risk = prop ? parseScore(prop.Risk_Score_0_to_100) : 0;
              const myNote = notes[fav.parcelId] || '';

              return (
                <tr
                  key={fav.parcelId}
                  onClick={() => prop && onRowClick(prop)}
                  className="table-row-hover border-b border-surface-border/50"
                >
                  <td className="px-4 py-2.5 text-olive-100 max-w-xs">
                    <span className="truncate block max-w-[200px]" title={fav.address}>
                      {displayValue(fav.address)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-olive-500 whitespace-nowrap">
                    {prop ? [prop.City, prop.County].filter(Boolean).join(', ') : '–'}
                  </td>
                  <td className="px-4 py-2.5 text-olive-400">
                    {prop?.Acquisition_Type || '–'}
                  </td>
                  <td className="px-4 py-2.5 text-brand-400 font-mono whitespace-nowrap">
                    {prop?.Estimated_Price_or_Min_Bid || '–'}
                  </td>
                  <td className="px-4 py-2.5">
                    {prop ? (
                      <span className={`badge ${getFitScoreClass(fit)} font-mono`}>{fit || '–'}</span>
                    ) : '–'}
                  </td>
                  <td className="px-4 py-2.5">
                    {prop ? (
                      <span className={`badge ${getRiskScoreClass(risk)} font-mono`}>{risk || '–'}</span>
                    ) : '–'}
                  </td>
                  <td className="px-4 py-2.5 text-olive-500 max-w-xs">
                    <span className="truncate block max-w-[150px]" title={myNote}>
                      {myNote || <span className="italic text-gray-700">No notes</span>}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-olive-600 whitespace-nowrap">
                    {new Date(fav.addedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={e => { e.stopPropagation(); onRemoveFavorite(fav.parcelId); }}
                      className="p-1 rounded hover:bg-red-900/40 text-olive-600 hover:text-accent-danger transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {favProperties.length < favorites.length && (
        <p className="text-xs text-yellow-600">
          ⚠ {favorites.length - favProperties.length} favorites are from a different CSV and aren't shown in the table above.
        </p>
      )}
    </div>
  );
}
