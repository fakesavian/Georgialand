import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Download, Heart, User, LogOut, Loader2, FlaskConical } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { getTierLabel } from '../../lib/auth';
import ThemeToggle from '../ThemeToggle';

interface HeaderProps {
  totalCount: number;
  filteredCount: number;
  favoritesCount: number;
  onExportAll: () => void;
  onExportFiltered: () => void;
  onExportFavorites: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Header({
  totalCount,
  filteredCount,
  favoritesCount,
  onExportAll,
  onExportFiltered,
  onExportFavorites,
  activeTab,
  onTabChange,
}: HeaderProps) {
  const { user, profile, accessLevel, realAccessLevel, isAdminTestMode, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const tabs = [
    { id: 'map', label: 'Map' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'data-quality', label: 'Data Quality' },
    { id: 'favorites', label: `Favorites (${favoritesCount})` },
    { id: 'agency-contacts', label: 'Agency Contacts' },
  ];

  return (
    <header className="dashboard-header bg-olive-950 border-b border-surface-border sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-2.5 sm:py-3 gap-2 sm:gap-4">
          {/* Logo — links back to home */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0 group">
            <div className="flex-shrink-0 w-9 h-9 bg-brand-600 group-hover:bg-brand-500 transition-colors rounded-lg flex items-center justify-center">
              <MapPin size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-white leading-tight truncate group-hover:text-brand-200 transition-colors">
                <span className="sm:hidden">GA Land Intel</span>
                <span className="hidden sm:inline">Georgia Land Intelligence</span>
              </h1>
              <p className="text-xs text-olive-500 hidden md:block">
                Land-bank, surplus, tax-sale &amp; GIS research dashboard
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Day/night toggle — lives in the header on desktop and mobile */}
            <ThemeToggle />

            {/* Stats pill */}
            <div className="hidden md:flex items-center gap-3 bg-olive-900 border border-surface-border rounded-lg px-3 py-1.5 text-xs text-olive-400">
              <span>
                <span className="text-brand-400 font-medium font-mono">{filteredCount}</span>
                <span> / {totalCount} listings</span>
              </span>
              {favoritesCount > 0 && (
                <span className="flex items-center gap-1">
                  <Heart size={11} className="text-accent-danger fill-red-400" />
                  <span className="text-accent-danger font-mono">{favoritesCount}</span>
                </span>
              )}
            </div>

            {/* Export dropdown */}
            <div className="relative group hidden sm:block">
              <button className="btn-ghost text-xs">
                <Download size={14} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-olive-900 border border-olive-700 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <button onClick={onExportAll} className="w-full text-left px-3 py-2 text-sm text-olive-200 hover:bg-olive-800 hover:text-white rounded-t-lg">Export All ({totalCount})</button>
                <button onClick={onExportFiltered} className="w-full text-left px-3 py-2 text-sm text-olive-200 hover:bg-olive-800 hover:text-white">Export Filtered ({filteredCount})</button>
                <button onClick={onExportFavorites} className="w-full text-left px-3 py-2 text-sm text-olive-200 hover:bg-olive-800 hover:text-white rounded-b-lg">Export Favorites ({favoritesCount})</button>
              </div>
            </div>

            {/* Auth / plan controls */}
            <div className="ml-2 pl-4 border-l border-surface-border flex items-center">
              {isLoading ? (
                <div className="flex items-center gap-2 text-olive-500">
                  <Loader2 size={14} className="animate-spin" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Admin test-mode badge — only visible when override is active */}
                  {isAdminTestMode && (
                    <Link
                      to="/admin"
                      className="hidden sm:flex items-center gap-1 rounded-lg border border-amber-500/50 bg-amber-500/10 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-300"
                      title="Admin test mode active — go to Admin to change tier"
                    >
                      <FlaskConical size={11} /> Test tier
                    </Link>
                  )}
                  <div className="hidden sm:flex items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-300">
                    <User size={13} />
                    <span className="uppercase tracking-wide">{getTierLabel(accessLevel)}</span>
                  </div>
                  {!isAdminTestMode && (
                    <Link to="/pricing" className="text-[11px] sm:text-xs font-semibold btn-primary py-1.5 px-2.5 sm:px-3">
                      Upgrade
                    </Link>
                  )}

                  {user ? (
                    <div className="relative group">
                      <button className="flex items-center gap-2 btn-ghost text-xs border border-surface-border">
                        <User size={14} />
                        <span className="hidden lg:inline max-w-[120px] truncate">{profile?.email || user.email}</span>
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-56 bg-olive-900 border border-olive-700 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                        {isAdminTestMode ? (
                          <div className="px-3 py-2 text-xs border-b border-olive-800 space-y-0.5">
                            <div className="text-olive-500">Real tier: <span className="font-mono text-olive-300">{realAccessLevel}</span></div>
                            <div className="text-amber-400 font-bold">Test tier: <span className="font-mono">{accessLevel}</span></div>
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-xs border-b border-olive-800 text-olive-400">
                            Level: <span className="font-mono text-brand-400 font-bold">{accessLevel}</span>
                          </div>
                        )}
                        {realAccessLevel === 'admin' && (
                          <Link to="/admin" className="block w-full text-left px-3 py-2 text-sm text-amber-300 hover:bg-olive-800 hover:text-amber-200">
                            Admin Dashboard
                          </Link>
                        )}
                        <Link to="/account" className="block w-full text-left px-3 py-2 text-sm text-olive-200 hover:bg-olive-800 hover:text-white">
                          My Account
                        </Link>
                        <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-olive-800 hover:text-red-300 rounded-b-lg flex items-center gap-2">
                          <LogOut size={14} /> Sign out
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dashboard-desktop-tabs hidden md:flex gap-0 border-t border-surface-border -mx-4 px-4 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-olive-500 hover:text-olive-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
