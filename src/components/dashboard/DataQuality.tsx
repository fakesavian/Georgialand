import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { LandProperty } from '../../types';

interface DataQualityProps {
  properties: LandProperty[];
  onRowClick: (p: LandProperty) => void;
}

interface QualityCheck {
  label: string;
  description: string;
  test: (p: LandProperty) => boolean;
}

const QUALITY_CHECKS: QualityCheck[] = [
  {
    label: 'Price',
    description: 'No price or minimum bid',
    test: (p) => !p.Estimated_Price_or_Min_Bid || p.Estimated_Price_or_Min_Bid.trim() === '' || p.Estimated_Price_or_Min_Bid.toLowerCase().includes('needs verification')
  },
  {
    label: 'Parcel ID',
    description: 'No parcel ID',
    test: (p) => !p.Parcel_ID || p.Parcel_ID.trim() === '' || p.Parcel_ID.toLowerCase().includes('needs verification')
  },
  {
    label: 'Zoning',
    description: 'No zoning info',
    test: (p) => !p.Zoning || p.Zoning.trim() === '' || p.Zoning.toLowerCase().includes('needs verification')
  },
  {
    label: 'Title Status',
    description: 'No title status',
    test: (p) => !p.Title_Status || p.Title_Status.trim() === '' || p.Title_Status.toLowerCase().includes('needs verification')
  },
  {
    label: 'Flood Status',
    description: 'No flood risk status',
    test: (p) => !p.Flood_Risk_Status || p.Flood_Risk_Status.trim() === '' || p.Flood_Risk_Status.toLowerCase().includes('needs verification')
  },
  {
    label: 'Utilities',
    description: 'No utilities info',
    test: (p) => {
      const u1 = p.Utilities_Available;
      const u2 = p.Utilities_Status;
      const val = (u1 || u2 || '').trim();
      return val === '' || val.toLowerCase().includes('needs verification');
    }
  },
  {
    label: 'Source URL',
    description: 'No source URL',
    test: (p) => !p.Source_URL || p.Source_URL.trim() === '' || p.Source_URL.toLowerCase().includes('needs verification')
  },
  {
    label: 'Agency Contact',
    description: 'No contact agency name',
    test: (p) => {
      const a1 = p.Contact_Agency_Name;
      const a2 = p.Source_Agency;
      const a3 = p.Source_Name;
      const val = (a1 || a2 || a3 || '').trim();
      return val === '' || val.toLowerCase().includes('needs verification');
    }
  }
];

export default function DataQuality({ properties, onRowClick }: DataQualityProps) {
  const summary = QUALITY_CHECKS.map(check => ({
    label: check.label,
    description: check.description,
    count: properties.filter(check.test).length,
  }));

  const allMissing = properties.filter(p =>
    QUALITY_CHECKS.some(c => c.test(p))
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div>
        <h2 className="section-title mb-4 text-white flex items-center gap-2">
          <AlertTriangle size={18} className="text-accent-warning" />
          Data Quality Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {summary.map(({ label, count }) => (
            <div key={label} className="stat-card p-3 bg-olive-900 border border-surface-border rounded-xl flex flex-col items-center">
              <span className={`text-xl font-bold font-mono ${count > 0 ? 'text-accent-warning' : 'text-brand-400'}`}>
                {count}
              </span>
              <span className="text-[10px] text-olive-500 mt-1 text-center leading-tight">{label} Issues</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overall completeness bar */}
      <div className="card bg-olive-900 border border-surface-border rounded-xl p-4">
        <h3 className="text-xs font-medium text-olive-400 mb-3 uppercase tracking-wider">Field Completeness</h3>
        <div className="space-y-3">
          {QUALITY_CHECKS.map(({ label, test }) => {
            const missing = properties.filter(test).length;
            const filled = properties.length - missing;
            const pct = properties.length > 0 ? Math.round((filled / properties.length) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex justify-between text-xs text-olive-400 mb-1">
                  <span>{label}</span>
                  <span className="font-mono">{pct}% ({filled}/{properties.length})</span>
                </div>
                <div className="h-1.5 bg-gray-850 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct >= 85 ? 'bg-brand-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table of incomplete records */}
      <div>
        <h3 className="section-title mb-4 text-white">
          Listings with Missing Data / Warnings
          <span className="badge bg-accent-warning/20 text-accent-warning border border-accent-warning/40 text-xs ml-2">
            {allMissing.length} listing{allMissing.length !== 1 ? 's' : ''}
          </span>
        </h3>
        <div className="card p-0 overflow-hidden bg-olive-900 border border-surface-border rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-border bg-gray-955">
                  <th className="px-4 py-2.5 text-left text-olive-400 font-medium">Address</th>
                  <th className="px-4 py-2.5 text-left text-olive-400 font-medium">City/County</th>
                  {QUALITY_CHECKS.map(c => (
                    <th key={c.label} className="px-3 py-2.5 text-center text-olive-400 font-medium whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allMissing.map((prop, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onRowClick(prop)}
                    className="table-row-hover border-b border-gray-850 hover:bg-olive-800/40 cursor-pointer"
                  >
                    <td className="px-4 py-2 text-olive-100 max-w-xs">
                      <span className="truncate block max-w-[180px]" title={prop.Property_Name_or_Address}>
                        {prop.Property_Name_or_Address || <span className="text-olive-600 italic">No address</span>}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-olive-500 whitespace-nowrap">
                      {[prop.City, prop.County].filter(Boolean).join(', ') || '–'}
                    </td>
                    {QUALITY_CHECKS.map(c => {
                      const isMissing = c.test(prop);
                      return (
                        <td key={c.label} className="px-3 py-2 text-center">
                          {isMissing ? (
                            <span className="text-accent-warning font-bold" title={c.description}>⚠</span>
                          ) : (
                            <span className="text-brand-500 font-display font-bold">✓</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {allMissing.length === 0 && (
                  <tr>
                    <td colSpan={2 + QUALITY_CHECKS.length} className="px-4 py-8 text-center text-brand-400 font-medium">
                      ✓ All listings are verified and 100% complete!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
