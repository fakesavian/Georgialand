import { FileText, AlertTriangle, AlertCircle } from 'lucide-react';

interface MetadataStats {
  total: number;
  latestResDate: string;
  staleCount: number;
  verifiedCount: number;
}

interface DashboardMetadataBarProps {
  loadedFilename: string;
  stats: MetadataStats;
}

export default function DashboardMetadataBar({ loadedFilename, stats }: DashboardMetadataBarProps) {
  return (
    <div className="bg-olive-900/60 border border-surface-border rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="hidden sm:flex items-center gap-1 text-olive-400">
          <FileText size={13} className="text-brand-500" />
          Source File: <strong className="text-olive-100">{loadedFilename}</strong>
        </span>
        <span className="hidden sm:inline text-olive-600">|</span>
        <span className="text-olive-400">
          Total Rows: <strong className="text-brand-400 font-mono">{stats.total}</strong>
        </span>
        <span className="hidden sm:inline text-olive-600">|</span>
        <span className="hidden sm:flex items-center gap-1 text-olive-400">
          Latest Research Date: <strong className="text-olive-100 font-mono">{stats.latestResDate}</strong>
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-accent-warning">
          <AlertTriangle size={13} />
          Stale Sources: <strong className="font-mono">{stats.staleCount}</strong>
        </span>
        <span className="flex items-center gap-1.5 text-orange-400">
          <AlertCircle size={13} />
          Needs Verification: <strong className="font-mono">{stats.verifiedCount}</strong>
        </span>
      </div>
    </div>
  );
}
