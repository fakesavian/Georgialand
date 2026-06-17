import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers, ShieldCheck, ShieldAlert, AlertTriangle, X,
  Clock, CheckCircle2, Database, ChevronRight, ExternalLink,
} from 'lucide-react';
import reviewData from '../../reports/gold_candidates_review_summary.json';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'gold' | 'near-ready' | 'blocked';

interface ReviewRow {
  Listing_ID: string;
  County: string;
  Address: string;
  ParcelID: string;
  Score: number;
  Status: string;
  Price: string;
  Acres: string;
  AcquisitionType: string;
  // gold + near-ready only
  Boundary_Verified?: string;
  Boundary_Confidence?: number;
  Verification_Level?: string;
  LastChecked?: string;
  // near-ready only
  Blocker?: string;
  // blocked only
  Blockers?: string[];
  // source fields (added in A6.2)
  Source_Name?: string;
  Source_URL?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALL_GOLD = reviewData.goldReady as ReviewRow[];
const ALL_NEAR_READY = reviewData.nearReadyOneBlocker as ReviewRow[];
const ALL_BLOCKED = reviewData.placeholderCountyBlocked as ReviewRow[];

// ─── Badge helpers ────────────────────────────────────────────────────────────

interface BadgeStyle { label: string; cls: string }

function resolveBlockerBadge(blocker: string): BadgeStyle {
  if (blocker === 'price_not_numeric')
    return { label: 'Price Missing', cls: 'bg-amber-950/70 text-amber-300 border border-amber-800/60' };
  if (blocker === 'parcel_id_unverified')
    return { label: 'Parcel ID Unverified', cls: 'bg-amber-950/70 text-amber-300 border border-amber-800/60' };
  if (blocker.includes('no GIS connector'))
    return { label: 'GIS Missing', cls: 'bg-orange-950/60 text-orange-300 border border-orange-800/50' };
  if (blocker.includes('GIS query failed'))
    return { label: 'Connector Failed', cls: 'bg-red-950/60 text-red-300 border border-red-800/50' };
  if (blocker.includes('listing_not_automated'))
    return { label: 'Not Auto-Verified', cls: 'bg-olive-800/60 text-olive-300 border border-olive-700/50' };
  return { label: blocker.slice(0, 32), cls: 'bg-olive-800/60 text-olive-300 border border-olive-700/50' };
}

function visibleBlockers(row: ReviewRow): string[] {
  const raw = row.Blocker ? [row.Blocker] : (row.Blockers ?? []);
  return raw.filter(b => !b.includes('listing_not_automated'));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 95 ? 'bg-brand-900/60 text-brand-300' :
    score >= 85 ? 'bg-brand-950/60 text-brand-400' :
                  'bg-amber-950/60 text-amber-300';
  return (
    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${cls}`}>
      {score}
    </span>
  );
}

function VerificationBadge({ level }: { level?: string }) {
  if (level === 'automated_gis_verified') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-brand-900/40 text-brand-300 border border-brand-800/50">
        <ShieldCheck size={11} /> GIS Verified
      </span>
    );
  }
  if (level === 'listing_level') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/50">
        <ShieldAlert size={11} /> Listing-Level Only
      </span>
    );
  }
  // No Verification_Level present — placeholder-county / blocked rows
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-orange-950/40 text-orange-300 border border-orange-800/50">
      <ShieldAlert size={11} /> GIS Not Verified
    </span>
  );
}

function RowCard({ row, onClick }: { row: ReviewRow; onClick: () => void }) {
  const blockers = visibleBlockers(row);

  return (
    <button
      onClick={onClick}
      className="card text-left w-full hover:border-brand-700/50 transition-colors group cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold text-olive-400">{row.Listing_ID}</span>
          <span className="text-xs text-olive-500">{row.County}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ScoreBadge score={row.Score} />
          <ChevronRight size={14} className="text-olive-600 group-hover:text-brand-400 transition-colors" />
        </div>
      </div>

      <p className="text-sm text-olive-200 mb-1 line-clamp-2 leading-snug">{row.Address}</p>
      <p className="text-xs text-olive-500 mb-3">
        {row.AcquisitionType} · {row.Acres} ac · {row.Price}
      </p>

      <div className="flex flex-wrap gap-1.5">
        <VerificationBadge level={row.Verification_Level} />
        {blockers.map((b, i) => {
          const badge = resolveBlockerBadge(b);
          return (
            <span key={i} className={`text-xs px-2 py-0.5 rounded ${badge.cls}`}>
              {badge.label}
            </span>
          );
        })}
      </div>
    </button>
  );
}

function DrawerField({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-widest text-olive-500 font-semibold">{label}</span>
      <span className="text-sm text-olive-200 break-words">{String(value)}</span>
    </div>
  );
}

function RowDrawer({ row, onClose }: { row: ReviewRow; onClose: () => void }) {
  const blockers = visibleBlockers(row);

  return (
    <div className="fixed inset-0 z-[200] flex">
      <div
        className="flex-1 bg-olive-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close drawer"
      />
      <div className="w-full max-w-sm sm:max-w-md bg-olive-900 border-l border-surface-border flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border bg-olive-950 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-olive-300">{row.Listing_ID}</span>
            <ScoreBadge score={row.Score} />
          </div>
          <button
            onClick={onClose}
            className="text-olive-400 hover:text-white p-1 rounded-md hover:bg-olive-800 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <VerificationBadge level={row.Verification_Level} />
            {blockers.map((b, i) => {
              const badge = resolveBlockerBadge(b);
              return (
                <span key={i} className={`text-xs px-2 py-0.5 rounded ${badge.cls}`}>
                  {badge.label}
                </span>
              );
            })}
            {row.Status === 'eligible' && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-brand-900/60 text-brand-200 border border-brand-700/50">
                <CheckCircle2 size={11} /> Eligible
              </span>
            )}
          </div>

          {/* Location */}
          <div className="space-y-3">
            <DrawerField label="Address" value={row.Address} />
            <DrawerField label="County" value={row.County} />
            <DrawerField label="Parcel ID" value={row.ParcelID} />
          </div>

          {/* Financials */}
          <div className="space-y-3 pt-3 border-t border-surface-border">
            <DrawerField label="Price" value={row.Price} />
            <DrawerField label="Lot Size" value={row.Acres ? `${row.Acres} acres` : undefined} />
            <DrawerField label="Acquisition Type" value={row.AcquisitionType} />
          </div>

          {/* Source */}
          <div className="space-y-3 pt-3 border-t border-surface-border">
            {row.Source_Name ? (
              <DrawerField label="Source" value={row.Source_Name} />
            ) : null}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-widest text-olive-500 font-semibold">Source URL</span>
              {row.Source_URL ? (
                <a
                  href={row.Source_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 transition-colors break-all"
                >
                  <ExternalLink size={12} className="shrink-0" />
                  {row.Source_URL}
                </a>
              ) : (
                <span className="text-xs text-olive-600 italic">
                  Not included in review report — see enriched CSV for source fields.
                </span>
              )}
            </div>
          </div>

          {/* Verification */}
          <div className="space-y-3 pt-3 border-t border-surface-border">
            <DrawerField label="GIS Boundary Verified" value={row.Boundary_Verified} />
            <DrawerField
              label="Boundary Confidence"
              value={row.Boundary_Confidence !== undefined ? `${row.Boundary_Confidence}/100` : undefined}
            />
            <DrawerField label="Verification Level" value={row.Verification_Level} />
            <DrawerField label="Last Checked" value={row.LastChecked} />
          </div>

          {/* Pipeline status */}
          <div className="space-y-3 pt-3 border-t border-surface-border">
            <DrawerField label="Readiness Score" value={row.Score} />
            <DrawerField label="Dataset Status" value={row.Status} />
            {row.Blocker && <DrawerField label="Blocker" value={row.Blocker} />}
            {row.Blockers && row.Blockers.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-olive-500 font-semibold">Blockers</span>
                <ul className="space-y-1">
                  {row.Blockers.map((b, i) => (
                    <li key={i} className="text-sm text-olive-200">• {b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border bg-olive-950/50 text-xs text-olive-500 shrink-0">
          Human review required before promotion to production dataset.
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TAB_CONFIG: { id: Tab; label: string; count: number }[] = [
  { id: 'gold',       label: 'Gold Ready',  count: ALL_GOLD.length },
  { id: 'near-ready', label: 'Near-Ready',  count: ALL_NEAR_READY.length },
  { id: 'blocked',    label: 'Blocked',     count: ALL_BLOCKED.length },
];

const TAB_ROWS: Record<Tab, ReviewRow[]> = {
  gold:         ALL_GOLD,
  'near-ready': ALL_NEAR_READY,
  blocked:      ALL_BLOCKED,
};

const TAB_DESCRIPTIONS: Record<Tab, React.ReactNode> = {
  gold: (
    <p className="text-sm text-olive-400 mb-5 flex items-center gap-2">
      <CheckCircle2 size={14} className="text-brand-400 shrink-0" />
      All gold gates met. Spot-check: verify a sample parcel boundary on map; confirm source URL is live.
    </p>
  ),
  'near-ready': (
    <p className="text-sm text-olive-400 mb-5 flex items-center gap-2">
      <Clock size={14} className="text-amber-400 shrink-0" />
      One blocker each — 7 rows need parcel ID confirmation; 1 row needs a numeric price.
    </p>
  ),
  blocked: (
    <p className="text-sm text-olive-400 mb-5 flex items-center gap-2">
      <ShieldAlert size={14} className="text-orange-400 shrink-0" />
      GIS connector unavailable. Blocked until Clarke / Richmond / Glynn / Sumter connectors are resolved or Regrid trial is approved.
    </p>
  ),
};

export default function DataReviewPage() {
  const [tab, setTab] = useState<Tab>('gold');
  const [selectedRow, setSelectedRow] = useState<ReviewRow | null>(null);

  const rows = TAB_ROWS[tab];

  return (
    <div className="min-h-screen bg-olive-950 text-olive-50 font-sans">
      {/* Nav */}
      <nav className="border-b border-surface-border bg-olive-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <Layers className="text-olive-600" size={24} />
            <span className="font-display font-bold text-lg text-olive-400 tracking-tight">Dataset Review</span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <Link to="/admin" className="text-olive-300 hover:text-white transition-colors">← Admin</Link>
            <Link to="/dashboard" className="text-olive-300 hover:text-white transition-colors">App</Link>
          </div>
        </div>
      </nav>

      <section className="py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Page header */}
          <div className="mb-6 flex items-start gap-4">
            <Database className="text-brand-500 shrink-0 mt-1" size={28} />
            <div>
              <h1 className="text-2xl font-display font-bold text-white tracking-tight">
                Gold Candidate Review Queue
              </h1>
              <p className="text-sm text-olive-400 mt-1">
                {reviewData.totalCandidates} candidates · pipeline run {reviewData.generatedAt.slice(0, 10)}
              </p>
            </div>
          </div>

          {/* Warning banner */}
          <div className="mb-8 p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl flex items-start gap-3">
            <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
            <div className="text-sm">
              <p className="text-amber-200 font-semibold">
                Enriched pipeline output — not yet promoted to production
              </p>
              <p className="text-amber-400/80 text-xs mt-1">
                This data reflects{' '}
                <code className="text-amber-300">data/output/georgia_land_gold_enriched.csv</code>.
                The production dataset (
                <code className="text-amber-300">public/local_dashboard_dataset.csv</code>) is unchanged
                until a human-reviewed promotion step is run manually.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-olive-900/60 rounded-xl mb-6 border border-surface-border w-fit overflow-x-auto">
            {TAB_CONFIG.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-olive-800 text-white shadow-sm'
                    : 'text-olive-400 hover:text-olive-200'
                }`}
              >
                {t.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    tab === t.id
                      ? 'bg-brand-600/40 text-brand-200'
                      : 'bg-olive-700/50 text-olive-400'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tab description */}
          {TAB_DESCRIPTIONS[tab]}

          {/* Card grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {rows.map(row => (
              <RowCard
                key={row.Listing_ID}
                row={row}
                onClick={() => setSelectedRow(row)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Detail drawer */}
      {selectedRow && (
        <RowDrawer row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </div>
  );
}
