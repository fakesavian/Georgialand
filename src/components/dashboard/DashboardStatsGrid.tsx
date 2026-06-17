export interface DashboardStats {
  total: number;
  atlCore: number;
  metroAtl: number;
  lba: number;
  taxSale: number;
  surplus: number;
  under50k: number;
  indAllowed: number;
  npOnly: number;
  alertWorthy: number;
  avgFit: number;
  avgRisk: number;
  avgConf: number;
  avgMonet: number;
  staleCount: number;
  verifiedCount: number;
  latestResDate: string;
}

interface DashboardStatsGridProps {
  stats: DashboardStats;
  isMobile: boolean;
}

export default function DashboardStatsGrid({ stats, isMobile }: DashboardStatsGridProps) {
  const allStatCards = [
    { label: 'Total Listings', value: stats.total, sub: 'Enriched', key: true },
    { label: 'Atlanta Core', value: stats.atlCore, sub: 'In-city' },
    { label: 'Metro Atlanta', value: stats.metroAtl, sub: '10 Counties' },
    { label: 'Georgia Land Banks', value: stats.lba, sub: 'LBA program' },
    { label: 'Tax Sale', value: stats.taxSale, sub: 'Sheriff auction' },
    { label: 'Surplus Lots', value: stats.surplus, sub: 'Gov owned' },
    { label: 'Under $50K', value: stats.under50k, sub: 'Budget focus', key: true },
    { label: 'Ind. Eligible', value: stats.indAllowed, sub: 'General buyers' },
    { label: 'Nonprofit Only', value: stats.npOnly, sub: 'Restricted' },
    { label: 'Alert Worthy', value: stats.alertWorthy, sub: 'Hot Deals', key: true },
    { label: 'Avg Fit Score', value: `${stats.avgFit}%`, sub: 'Out of 100', highlight: 'text-brand-400', key: true },
    { label: 'Avg Risk Score', value: `${stats.avgRisk}%`, sub: 'Out of 100', highlight: 'text-accent-warning' },
    { label: 'Avg Data Conf.', value: `${stats.avgConf}%`, sub: 'Out of 100', highlight: 'text-blue-400' },
    { label: 'Avg Monetization', value: `${stats.avgMonet}%`, sub: 'Commercial value', highlight: 'text-purple-400' },
  ];
  const cards = isMobile ? allStatCards.filter(c => c.key) : allStatCards;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((card, i) => (
        <div key={i} className="bg-olive-900 border border-surface-border rounded-xl p-3 flex flex-col justify-between shadow-md">
          <div className="text-olive-500 text-[10px] uppercase font-bold tracking-wider">{card.label}</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-lg font-extrabold font-mono ${card.highlight || 'text-white'}`}>
              {card.value}
            </span>
            <span className="text-[9px] text-olive-600 truncate max-w-[50px]">{card.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
