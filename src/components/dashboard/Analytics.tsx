import React from 'react';
import { LandProperty } from '../../types';
import { parseScore, parsePrice } from '../../utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, CartesianGrid,
  Cell, PieChart, Pie, Legend,
} from 'recharts';

const COLORS = ['#22c55e', '#16a34a', '#15803d', '#166534', '#4ade80', '#86efac', '#bbf7d0'];

interface AnalyticsProps {
  properties: LandProperty[];
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, number> {
  return arr.reduce((acc, item) => {
    const k = key(item) || 'Unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function toBarData(obj: Record<string, number>, limit = 15) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 18) + '…' : name, value }));
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-olive-900 border border-olive-700 rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-olive-200 font-medium">{label}</p>
        <p className="text-brand-400 font-mono">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const ScatterTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (active && payload && payload.length >= 2) {
    return (
      <div className="bg-olive-900 border border-olive-700 rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-brand-400">Fit: {payload[0].value}</p>
        <p className="text-accent-warning">Risk: {payload[1].value}</p>
      </div>
    );
  }
  return null;
};

export default function Analytics({ properties }: AnalyticsProps) {
  // Summary stats
  const atlanta = properties.filter(p => (p.City || '').toLowerCase() === 'atlanta');
  const metro = properties.filter(p => (p.Metro_Atlanta || '').toLowerCase() === 'yes');
  const under50k = properties.filter(p => {
    const price = parsePrice(p.Estimated_Price_or_Min_Bid);
    return price !== null && price < 50000;
  });
  const landBank = properties.filter(p => (p.Acquisition_Type || '').toLowerCase().includes('land bank'));
  const taxDeed = properties.filter(p => (p.Acquisition_Type || '').toLowerCase().includes('tax'));

  const fitScores = properties.map(p => parseScore(p.Fit_Score_0_to_100)).filter(n => n > 0);
  const riskScores = properties.map(p => parseScore(p.Risk_Score_0_to_100)).filter(n => n > 0);
  const avgFit = fitScores.length ? Math.round(fitScores.reduce((a, b) => a + b, 0) / fitScores.length) : 0;
  const avgRisk = riskScores.length ? Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length) : 0;

  const highestFit = [...properties].sort((a, b) => parseScore(b.Fit_Score_0_to_100) - parseScore(a.Fit_Score_0_to_100))[0];
  const lowestRisk = [...properties].sort((a, b) => parseScore(a.Risk_Score_0_to_100) - parseScore(b.Risk_Score_0_to_100))[0];

  // Chart data
  const byCounty = toBarData(groupBy(properties, p => p.County));
  const byAcquisition = toBarData(groupBy(properties, p => p.Acquisition_Type));
  const byPriceCategory = toBarData(groupBy(properties, p => p.Price_Category));
  const top10ByFit = [...properties]
    .filter(p => parseScore(p.Fit_Score_0_to_100) > 0)
    .sort((a, b) => parseScore(b.Fit_Score_0_to_100) - parseScore(a.Fit_Score_0_to_100))
    .slice(0, 10)
    .map(p => ({
      name: (p.Property_Name_or_Address || 'Unknown').slice(0, 22),
      fit: parseScore(p.Fit_Score_0_to_100),
      risk: parseScore(p.Risk_Score_0_to_100),
    }));

  const scatterData = properties
    .filter(p => parseScore(p.Fit_Score_0_to_100) > 0 && parseScore(p.Risk_Score_0_to_100) > 0)
    .map(p => ({
      fit: parseScore(p.Fit_Score_0_to_100),
      risk: parseScore(p.Risk_Score_0_to_100),
    }));

  const stats = [
    { label: 'Total Listings', value: properties.length, color: 'text-brand-400' },
    { label: 'Atlanta', value: atlanta.length, color: 'text-blue-400' },
    { label: 'Metro Atlanta', value: metro.length, color: 'text-cyan-400' },
    { label: 'Under $50K', value: under50k.length, color: 'text-accent-warning' },
    { label: 'Land Bank', value: landBank.length, color: 'text-purple-400' },
    { label: 'Tax Deed/Sale', value: taxDeed.length, color: 'text-orange-400' },
    { label: 'Avg Fit Score', value: avgFit, color: 'text-brand-400', suffix: '/100' },
    { label: 'Avg Risk Score', value: avgRisk, color: 'text-accent-danger', suffix: '/100' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {stats.map(({ label, value, color, suffix }) => (
          <div key={label} className="stat-card">
            <span className={`text-2xl font-bold font-mono ${color}`}>
              {value}{suffix || ''}
            </span>
            <span className="text-xs text-olive-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Best property cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {highestFit && (
          <div className="card border-brand-800">
            <p className="text-xs text-brand-500 font-medium mb-1">🏆 Highest Fit Score</p>
            <p className="text-sm font-medium text-white">{highestFit.Property_Name_or_Address || '–'}</p>
            <p className="text-xs text-olive-500">{[highestFit.City, highestFit.County].filter(Boolean).join(', ')}</p>
            <p className="text-lg font-bold font-mono text-brand-400 mt-1">
              {parseScore(highestFit.Fit_Score_0_to_100)}/100
            </p>
          </div>
        )}
        {lowestRisk && (
          <div className="card border-blue-800">
            <p className="text-xs text-blue-400 font-medium mb-1">🛡️ Lowest Risk Score</p>
            <p className="text-sm font-medium text-white">{lowestRisk.Property_Name_or_Address || '–'}</p>
            <p className="text-xs text-olive-500">{[lowestRisk.City, lowestRisk.County].filter(Boolean).join(', ')}</p>
            <p className="text-lg font-bold font-mono text-blue-400 mt-1">
              {parseScore(lowestRisk.Risk_Score_0_to_100)}/100
            </p>
          </div>
        )}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By County */}
        <div className="card">
          <h3 className="section-title mb-4">Listings by County</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCounty} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]}>
                {byCounty.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Acquisition Type */}
        <div className="card">
          <h3 className="section-title mb-4">Listings by Acquisition Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={byAcquisition}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {byAcquisition.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#f9fafb' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* By Price Category */}
        <div className="card">
          <h3 className="section-title mb-4">Listings by Price Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byPriceCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]}>
                {byPriceCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fit vs Risk Scatter */}
        <div className="card">
          <h3 className="section-title mb-4">Fit Score vs Risk Score</h3>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="fit" name="Fit" type="number" domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#6b7280' }} label={{ value: 'Fit', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 11 }} />
              <YAxis dataKey="risk" name="Risk" type="number" domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#6b7280' }} label={{ value: 'Risk', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }} />
              <Tooltip content={<ScatterTooltip />} />
              <Scatter data={scatterData} fill="#22c55e" opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-xs text-olive-600 mt-2">Best: high fit (right), low risk (bottom)</p>
        </div>

        {/* Top 10 by Fit */}
        <div className="card lg:col-span-2">
          <h3 className="section-title mb-4">Top 10 Listings by Fit Score</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top10ByFit}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="fit" name="Fit Score" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="risk" name="Risk Score" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.7} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
