import React from 'react';
import {
  ChevronUp, ChevronDown, Heart, MapPin, ExternalLink, FileText,
  Map as MapIcon, Tag, AlertCircle, Info,
} from 'lucide-react';
import { LandProperty, SortConfig } from '../../types';
import {
  getFitScoreClass, getRiskScoreClass, parseScore, isValidUrl, getPropertyWarnings,
} from '../../utils';

// ─── Sub-components ──────────────────────────────────────────────────────────

function SortBtn({
  label, col, sortConfig, onSort,
}: {
  label: string;
  col: keyof LandProperty;
  sortConfig: SortConfig;
  onSort: (k: keyof LandProperty) => void;
}) {
  const active = sortConfig.key === col;
  return (
    <button
      onClick={() => onSort(col)}
      className={`flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors focus:outline-none ${
        active ? 'text-brand-400' : 'text-olive-500 hover:text-olive-200'
      }`}
    >
      {label}
      {active
        ? sortConfig.direction === 'asc'
          ? <ChevronUp size={11} />
          : <ChevronDown size={11} />
        : <ChevronUp size={11} className="opacity-30" />}
    </button>
  );
}

function AcquisitionBadge({ type }: { type: string }) {
  if (!type) return null;
  const lower = type.toLowerCase();
  let cls = 'bg-olive-800 text-olive-300 border-olive-700';
  if (lower.includes('land bank')) cls = 'bg-brand-950/50 text-brand-400 border-brand-800/60';
  else if (lower.includes('tax') || lower.includes('sheriff')) cls = 'bg-amber-950/50 text-amber-400 border-amber-800/60';
  else if (lower.includes('surplus')) cls = 'bg-purple-950/50 text-purple-400 border-purple-800/60';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border leading-none ${cls}`}>
      <Tag size={9} />
      {type}
    </span>
  );
}

function ScorePill({
  value, label, type,
}: {
  value: string;
  label: string;
  type: 'fit' | 'risk';
}) {
  const n = parseScore(value);
  const cls = type === 'fit' ? getFitScoreClass(n) : getRiskScoreClass(n);
  if (!n) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-bold text-olive-600 uppercase tracking-wide w-6">{label}</span>
        <span className="text-xs font-mono text-olive-700">–</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] font-bold text-olive-500 uppercase tracking-wide w-6">{label}</span>
      <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold border ${cls}`}>{n}</span>
    </div>
  );
}

function ActionBtn({
  href, icon, label, colorClass,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  colorClass: string;
}) {
  if (!isValidUrl(href)) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={label}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border transition-all duration-150 ${colorClass}`}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </a>
  );
}

// ─── Column sort header (desktop row header) ──────────────────────────────────

function ColumnHeader({
  sortConfig, onSort,
}: {
  sortConfig: SortConfig;
  onSort: (k: keyof LandProperty) => void;
}) {
  return (
    <div className="hidden md:grid grid-cols-[1fr_160px_130px_130px] gap-4 items-center px-4 py-2.5 border-b border-surface-border bg-olive-950/80 sticky top-0 z-10">
      {/* Property */}
      <div className="flex items-center gap-4">
        <div className="w-10 shrink-0" />
        <div className="flex items-center gap-3">
          <SortBtn label="Property" col="Property_Name_or_Address" sortConfig={sortConfig} onSort={onSort} />
          <SortBtn label="City" col="City" sortConfig={sortConfig} onSort={onSort} />
        </div>
      </div>
      {/* Deal Snapshot */}
      <div className="flex items-center gap-3">
        <SortBtn label="Price" col="Estimated_Price_or_Min_Bid" sortConfig={sortConfig} onSort={onSort} />
        <SortBtn label="Acres" col="Lot_Size_Acres" sortConfig={sortConfig} onSort={onSort} />
      </div>
      {/* Scores */}
      <div className="flex items-center gap-3">
        <SortBtn label="Fit" col="Fit_Score_0_to_100" sortConfig={sortConfig} onSort={onSort} />
        <SortBtn label="Risk" col="Risk_Score_0_to_100" sortConfig={sortConfig} onSort={onSort} />
      </div>
      {/* Actions */}
      <div className="text-[10px] font-bold uppercase tracking-wider text-olive-600 text-right pr-1">
        Actions
      </div>
    </div>
  );
}

// ─── Single property row ──────────────────────────────────────────────────────

function PropertyRow({
  prop,
  idx,
  isFav,
  onRowClick,
  onToggleFavorite,
}: {
  prop: LandProperty;
  idx: number;
  isFav: boolean;
  onRowClick: (p: LandProperty) => void;
  onToggleFavorite: (p: LandProperty) => void;
}) {
  const address = prop.Property_Name_or_Address || 'Unknown Address';
  const location = [prop.City, prop.County ? `${prop.County} Co.` : '', 'GA']
    .filter(Boolean).join(', ');
  const price = prop.Estimated_Price_or_Min_Bid;
  const priceCategory = prop.Price_Category;
  const acres = prop.Lot_Size_Acres;
  const zoning = prop.Zoning;
  const propType = prop.Property_Type;
  const warnings = getPropertyWarnings(prop);
  const dataConf = prop.Data_Confidence_0_to_100;

  const evenRow = idx % 2 === 0;

  return (
    <div
      onClick={() => onRowClick(prop)}
      className={`
        group relative cursor-pointer transition-colors duration-150
        hover:bg-brand-950/30 hover:border-l-2 hover:border-brand-600
        ${evenRow ? 'bg-transparent' : 'bg-olive-900/15'}
        border-b border-surface-border/40
      `}
    >
      {/* ── Desktop layout: 4-column grid ── */}
      <div className="hidden md:grid grid-cols-[1fr_160px_130px_130px] gap-4 items-center px-4 py-3.5">

        {/* ▌COL 1 — Property ▌*/}
        <div className="flex items-start gap-3 min-w-0">
          {/* Favorite + rank */}
          <div className="flex flex-col items-center gap-2 shrink-0 pt-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(prop); }}
              className="focus:outline-none"
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                size={15}
                className={isFav
                  ? 'text-red-400 fill-red-400'
                  : 'text-olive-700 group-hover:text-red-500 transition-colors'}
              />
            </button>
            {prop.Priority_Rank && (
              <span className="text-[9px] font-mono font-bold text-brand-600 leading-none">
                #{prop.Priority_Rank}
              </span>
            )}
          </div>

          {/* Address block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 group-hover:text-brand-200 transition-colors">
                {address}
              </h3>
              {warnings.length > 0 && (
                <span title={warnings.join('; ')}>
                  <AlertCircle size={12} className="shrink-0 text-amber-500" />
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="flex items-center gap-1 text-[11px] text-olive-400">
                <MapPin size={10} className="shrink-0 text-olive-600" />
                <span className="truncate max-w-[160px]">{location}</span>
              </span>
              <AcquisitionBadge type={prop.Acquisition_Type} />
            </div>
            {prop.Parcel_ID && !prop.Parcel_ID.toLowerCase().includes('needs') && (
              <div className="mt-1 text-[10px] font-mono text-olive-700 truncate">
                ID: {prop.Parcel_ID}
              </div>
            )}
          </div>
        </div>

        {/* ▌COL 2 — Deal Snapshot ▌*/}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-brand-400 font-mono font-bold text-sm leading-tight truncate">
            {price || priceCategory || <span className="text-olive-700 font-normal">–</span>}
          </div>
          {acres && (
            <div className="text-[11px] text-olive-400">
              {acres} ac
            </div>
          )}
          {zoning && (
            <div className="text-[10px] text-olive-600 truncate" title={zoning}>
              {zoning}
            </div>
          )}
          {propType && (
            <div className="text-[10px] text-olive-600 truncate" title={propType}>
              {propType}
            </div>
          )}
        </div>

        {/* ▌COL 3 — Scores ▌*/}
        <div className="flex flex-col gap-1.5">
          <ScorePill value={prop.Fit_Score_0_to_100} label="FIT" type="fit" />
          <ScorePill value={prop.Risk_Score_0_to_100} label="RSK" type="risk" />
          {dataConf && (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-olive-600 uppercase tracking-wide w-6">CNF</span>
              <span className="text-[10px] font-mono text-olive-500">{parseScore(dataConf)}%</span>
            </div>
          )}
        </div>

        {/* ▌COL 4 — Actions ▌*/}
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <button
            onClick={(e) => { e.stopPropagation(); onRowClick(prop); }}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border border-brand-800/50 text-brand-400 bg-brand-950/30 hover:bg-brand-900/50 transition-colors"
          >
            <Info size={11} />
            <span className="hidden xl:inline">Details</span>
          </button>
          <ActionBtn
            href={prop.Source_URL}
            icon={<ExternalLink size={11} />}
            label="Source"
            colorClass="border-olive-700/50 text-olive-400 bg-olive-900/30 hover:text-white hover:bg-olive-700/50"
          />
          <ActionBtn
            href={prop.Map_URL}
            icon={<MapPin size={11} />}
            label="Map"
            colorClass="border-olive-700/50 text-olive-400 bg-olive-900/30 hover:text-brand-300 hover:bg-brand-950/50"
          />
        </div>
      </div>

      {/* ── Mobile layout: stacked card ── */}
      <div className="flex md:hidden flex-col gap-3 p-4">
        {/* Top row: fav + address */}
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(prop); }}
            className="mt-0.5 shrink-0 focus:outline-none"
          >
            <Heart
              size={16}
              className={isFav ? 'text-red-400 fill-red-400' : 'text-olive-700'}
            />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {prop.Priority_Rank && (
                <span className="text-[10px] font-mono font-bold text-brand-500">#{prop.Priority_Rank}</span>
              )}
              <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 flex-1">
                {address}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="text-[11px] text-olive-400 flex items-center gap-1">
                <MapPin size={10} className="text-olive-600 shrink-0" />
                {location}
              </span>
              <AcquisitionBadge type={prop.Acquisition_Type} />
            </div>
          </div>
        </div>

        {/* Middle row: deal snapshot + scores */}
        <div className="flex items-center justify-between ml-7">
          {/* Deal snapshot */}
          <div className="flex flex-col gap-0.5">
            <span className="text-brand-400 font-mono font-bold text-sm">
              {price || priceCategory || '–'}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-olive-500">
              {acres && <span>{acres} ac</span>}
              {zoning && <span className="truncate max-w-[80px]">{zoning}</span>}
            </div>
          </div>
          {/* Scores */}
          <div className="flex items-center gap-3">
            <ScorePill value={prop.Fit_Score_0_to_100} label="FIT" type="fit" />
            <ScorePill value={prop.Risk_Score_0_to_100} label="RSK" type="risk" />
          </div>
        </div>

        {/* Bottom row: actions */}
        <div className="flex items-center gap-2 ml-7 border-t border-surface-border/30 pt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onRowClick(prop); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-brand-800/50 text-brand-400 bg-brand-950/30 hover:bg-brand-900/50 transition-colors"
          >
            <Info size={12} />
            Details
          </button>
          {isValidUrl(prop.Source_URL) && (
            <a
              href={prop.Source_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-olive-700/50 text-olive-400 bg-olive-900/30 hover:text-white transition-colors"
            >
              <ExternalLink size={12} />
              Source
            </a>
          )}
          {isValidUrl(prop.Map_URL) && (
            <a
              href={prop.Map_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-olive-700/50 text-olive-400 bg-olive-900/30 hover:text-brand-300 transition-colors"
            >
              <MapPin size={12} />
              Map
            </a>
          )}
          {isValidUrl(prop.Property_Page_URL) && (
            <a
              href={prop.Property_Page_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-olive-700/50 text-olive-400 bg-olive-900/30 hover:text-white transition-colors"
            >
              <FileText size={12} />
              Listing
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

export interface PropertyTableProps {
  properties: LandProperty[];
  sortConfig: SortConfig;
  onSort: (key: keyof LandProperty) => void;
  onRowClick: (p: LandProperty) => void;
  favorites: Set<string>;
  onToggleFavorite: (p: LandProperty) => void;
}

export default function PropertyTable({
  properties,
  sortConfig,
  onSort,
  onRowClick,
  favorites,
  onToggleFavorite,
}: PropertyTableProps) {
  if (properties.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center h-48 gap-3 text-olive-500">
        <MapIcon size={28} className="opacity-30" />
        <span className="text-sm">No properties match the current filters.</span>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden flex flex-col">
      {/* Sticky desktop header */}
      <ColumnHeader sortConfig={sortConfig} onSort={onSort} />

      {/* Property rows */}
      <div>
        {properties.map((prop, idx) => {
          const favId = prop.Parcel_ID || prop.Property_Name_or_Address;
          return (
            <PropertyRow
              key={idx}
              prop={prop}
              idx={idx}
              isFav={favorites.has(favId)}
              onRowClick={onRowClick}
              onToggleFavorite={onToggleFavorite}
            />
          );
        })}
      </div>

      {/* Footer count */}
      <div className="px-4 py-2.5 border-t border-surface-border bg-olive-950/60 text-[11px] text-olive-500 font-medium flex items-center justify-between">
        <span>
          Showing{' '}
          <span className="text-brand-400 font-mono font-bold">{properties.length}</span>
          {' '}listing{properties.length !== 1 ? 's' : ''}
        </span>
        <span className="text-olive-700 text-[10px]">Click any row to open full details</span>
      </div>
    </div>
  );
}
