import React from 'react';
import { Map, List, BarChart3, Database, Star } from 'lucide-react';

interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface MobileDashboardNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  favoritesCount: number;
}

export default function MobileDashboardNav({ activeTab, onTabChange, favoritesCount }: MobileDashboardNavProps) {
  const items: MobileNavItem[] = [
    { id: 'map', label: 'Map', icon: <Map size={18} /> },
    { id: 'dashboard', label: 'List', icon: <List size={18} /> },
    { id: 'analytics', label: 'Stats', icon: <BarChart3 size={18} /> },
    { id: 'data-quality', label: 'Quality', icon: <Database size={18} /> },
    { id: 'favorites', label: 'Saved', icon: <Star size={18} />, count: favoritesCount },
  ];

  return (
    <nav className="mobile-dashboard-nav" aria-label="Dashboard sections">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onTabChange(item.id)}
          className={`mobile-dashboard-nav__item ${activeTab === item.id ? 'is-active' : ''}`}
          aria-current={activeTab === item.id ? 'page' : undefined}
        >
          <span className="relative">
            {item.icon}
            {typeof item.count === 'number' && item.count > 0 && (
              <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                {item.count > 9 ? '9+' : item.count}
              </span>
            )}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
