import React from 'react';
import { ExternalLink, Heart, MapPin, Lock } from 'lucide-react';
import { LandProperty } from '../../types';
import { getFitScoreClass, getRiskScoreClass, parseScore, displayValue, isValidUrl, getProList, getConsList, getSatelliteImageUrl } from '../../utils';

interface PropertyCardProps {
  property: LandProperty;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  id?: string;
}

function CardUrlBtn({ url, label }: { url: string; label: string }) {
  const valid = isValidUrl(url);
  return (
    <a
      href={valid ? url : undefined}
      target={valid ? '_blank' : undefined}
      rel="noopener noreferrer"
      onClick={e => { if (!valid) e.preventDefault(); e.stopPropagation(); }}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border transition-all ${
        valid
          ? 'bg-green-900/30 border-brand-800 text-brand-400 hover:bg-green-800/50'
          : 'bg-olive-800 border-olive-700 text-gray-700 cursor-not-allowed'
      }`}
    >
      {valid ? <ExternalLink size={9} /> : <Lock size={9} />}
      {label}
    </a>
  );
}

export default function PropertyCard({ property, onClick, isFavorite, onToggleFavorite, isHovered, onMouseEnter, onMouseLeave, id }: PropertyCardProps) {
  const fit = parseScore(property.Fit_Score_0_to_100);
  const risk = parseScore(property.Risk_Score_0_to_100);
  const pros = getProList(property.Pros);
  const cons = getConsList(property.Cons);
  const imageUrl = getSatelliteImageUrl(property.Latitude, property.Longitude, 17);

  return (
    <div
      id={id}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`card cursor-pointer flex flex-col gap-3 group animate-fade-in p-0 overflow-hidden shrink-0 transition-all duration-150 ${
        isHovered ? 'border-brand-500 bg-olive-800/80 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'hover:border-gray-600 hover:bg-olive-800/60'
      }`}
    >
      {/* Image Header */}
      <div className="w-full h-40 bg-olive-900 relative border-b border-surface-border shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Satellite View"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-gradient-to-br from-olive-900 to-olive-950">
            <MapPin size={24} className="mb-2 opacity-30" />
            <span className="text-xs text-olive-600">No Coordinates</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {property.Priority_Rank && (
            <span className="bg-olive-900/80 backdrop-blur border border-olive-700 text-xs font-mono text-brand-400 font-bold px-2 py-0.5 rounded shadow-sm">
              #{property.Priority_Rank}
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(e); }}
          className={`absolute top-2 right-2 p-1.5 rounded-full border shadow-sm transition-all ${
            isFavorite
              ? 'bg-red-900/80 border-accent-danger/40 text-accent-danger backdrop-blur'
              : 'bg-olive-900/60 border-olive-700 text-white hover:text-accent-danger opacity-0 group-hover:opacity-100 backdrop-blur'
          }`}
        >
          <Heart size={14} className={isFavorite ? 'fill-red-400' : ''} />
        </button>
      </div>

      <div className="p-4 pt-1 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wide">{property.Acquisition_Type || 'Unknown Type'}</span>
            </div>
            <h3 className="text-sm font-medium text-white leading-snug line-clamp-2">
              {displayValue(property.Property_Name_or_Address)}
            </h3>
            <p className="text-xs text-olive-400 mt-1 flex items-center gap-1.5">
              <MapPin size={11} />
              {[property.City, property.County, 'GA'].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>

      {/* Scores */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`badge ${getFitScoreClass(fit)} font-mono text-xs`}>Fit: {fit || '–'}</span>
        <span className={`badge ${getRiskScoreClass(risk)} font-mono text-xs`}>Risk: {risk || '–'}</span>
        {property.Price_Category && (
          <span className="badge bg-olive-800 border-olive-700 text-olive-200 text-xs">{property.Price_Category}</span>
        )}
      </div>

      {/* Key details */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {[
          { label: 'Price', value: property.Estimated_Price_or_Min_Bid },
          { label: 'Lot Size', value: property.Lot_Size_Acres ? `${property.Lot_Size_Acres} acres` : '' },
          { label: 'Zoning', value: property.Zoning },
          { label: 'Property Type', value: property.Property_Type },
        ].map(({ label, value }) => (
          <div key={label}>
            <span className="text-olive-600">{label}: </span>
            <span className={value ? 'text-olive-200' : 'text-gray-700 italic'}>
              {value || 'N/A'}
            </span>
          </div>
        ))}
      </div>

      {/* Pros & Cons */}
      {(pros.length > 0 || cons.length > 0) && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {pros.length > 0 && (
            <div>
              <p className="text-brand-500 font-medium mb-1">Pros</p>
              {pros.map((p: any, i: number) => (
                <p key={i} className="text-olive-400 truncate">• {p}</p>
              ))}
            </div>
          )}
          {cons.length > 0 && (
            <div>
              <p className="text-accent-danger font-medium mb-1">Cons</p>
              {cons.map((c: any, i: number) => (
                <p key={i} className="text-olive-400 truncate">• {c}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommended action */}
      {property.Recommended_Next_Action && (
        <p className="text-xs text-green-300/70 italic line-clamp-2">
          → {property.Recommended_Next_Action}
        </p>
      )}

      {/* URL buttons */}
      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-surface-border/50">
        <CardUrlBtn url={property.Source_URL} label="Source" />
        <CardUrlBtn url={property.Property_Page_URL} label="Property" />
        <CardUrlBtn url={property.Map_URL} label="Map" />
        <CardUrlBtn url={property.GIS_URL} label="GIS" />
      </div>
      </div>
    </div>
  );
}
