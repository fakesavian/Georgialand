import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import { LayoutGrid, List, Map, Loader2, AlertCircle, FileText, CheckSquare, Square, AlertTriangle, Coins, Star, Users } from 'lucide-react';

import Header from '../components/dashboard/Header';
import FilterPanel from '../components/dashboard/FilterPanel';
import PropertyTable from '../components/dashboard/PropertyTable';
import PropertyCard from '../components/dashboard/PropertyCard';
import PropertyDrawer from '../components/dashboard/PropertyDrawer';
import Analytics from '../components/dashboard/Analytics';
import DataQuality from '../components/dashboard/DataQuality';
import FavoritesView from '../components/dashboard/FavoritesView';
import AgencyContacts from '../components/dashboard/AgencyContacts';
import SponsorBanner from '../components/marketing/SponsorBanner';

import { LandProperty, ViewMode, SortConfig, Filters, Favorite } from '../types';
import { filterProperties, sortProperties, exportToCSV, exportToMarkdown, exportToHTML, getPropertyWarnings, parsePrice, parseScore } from '../utils';
import { canExport, canViewFullDatabase, getMaxRowsAllowed, canViewAgencyContacts, canUseFavorites, canUseNotes, canExportLeadCards, canUseInvestorTools } from '../lib/auth';
import { useAuth } from '../lib/AuthContext';
import { fetchDashboardData } from '../lib/dataFetcher';
import { trackEvent } from '../lib/analytics';
import SEO from '../components/SEO';
import { sponsors } from '../data/sponsors';

const DEFAULT_FILTERS: Filters = {
  search: '',
  city: '', county: '', acquisitionType: '', priceCategory: '',
  zoning: '', propertyType: '',
  regionTier: '', metroArea: '', dealType: '', buyerProfile: '',
  sourceFreshness: '', readiness: '', eligibleBuyerType: '',
  individualBuyerAllowed: '', nonprofitOnly: '', builderRequired: '',
  alertWorthy: '', avoidFlag: '',
  fitScoreMin: 0, fitScoreMax: 100,
  riskScoreMin: 0, riskScoreMax: 100,
  dataConfidenceMin: 0, dataConfidenceMax: 100,
  monetizationValueMin: 0, monetizationValueMax: 100,
  affordableHousingReq: '', redemptionRisk: '', floodRiskStatus: '', titleStatus: '',
  under50k: false, atlantaOnly: false, metroAtlantaOnly: false,
  lowRiskOnly: false, needsVerification: false,
};

const LS_FAVORITES = 'glf_favorites';
const LS_NOTES = 'glf_notes';

function loadFromLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function saveToLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

// Lazy-load MapView to avoid SSR/bundle issues
const MapView = React.lazy(() => import('../components/dashboard/MapView'));

export default function App() {
  const { accessLevel } = useAuth();
  const [properties, setProperties] = useState<LandProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'Priority_Rank', direction: 'asc' });
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentSubTab, setCurrentSubTab] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState<LandProperty | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>(() => loadFromLS(LS_FAVORITES, []));
  const [notes, setNotes] = useState<Record<string, string>>(() => loadFromLS(LS_NOTES, {}));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadedFilename, setLoadedFilename] = useState('');

  // Load CSV
  const loadCSV = useCallback((text: string) => {
    setError(null);
    Papa.parse<LandProperty>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(),
      transform: (v: string) => v.trim(),
      complete: (result) => {
        if (result.errors.length > 0 && result.data.length === 0) {
          setError('Failed to parse CSV: ' + result.errors[0]?.message);
        } else {
          let data = result.data as LandProperty[];
          const maxRows = getMaxRowsAllowed(accessLevel);
          if (maxRows !== null) {
            data = data.slice(0, maxRows);
          }
          setProperties(data);
        }
        setLoading(false);
      },
      error: (err: Error) => {
        setError('CSV parse error: ' + err.message);
        setLoading(false);
      },
    });
  }, []);

  // Auto-load CSV based on access level
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const result = await fetchDashboardData(accessLevel);
      
      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else if (result.data) {
        loadCSV(result.data);
        setLoadedFilename(result.filename);
      }
    }
    loadData();
  }, [loadCSV, accessLevel]);

  // Handle file upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setLoadedFilename(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      loadCSV(ev.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Pipeline: properties -> sub-tab filtering -> user filters & sorting
  const subTabFilteredProperties = useMemo(() => {
    return properties.filter(p => {
      switch (currentSubTab) {
        case 'atlanta-core':
          return (p.Region_Tier || '').toLowerCase() === 'atlanta core' || (p.City || '').toLowerCase() === 'atlanta';
        case 'metro-atlanta':
          return (p.Region_Tier || '').toLowerCase() === 'metro-atlanta' || (p.Region_Tier || '').toLowerCase() === 'metro atlanta' || (p.Metro_Atlanta || '').toLowerCase() === 'yes';
        case 'land-banks':
          return (p.Acquisition_Type || '').toLowerCase() === 'land bank' || (p.Land_Bank_Status || '').toLowerCase() === 'yes' || (p.Region_Tier || '').toLowerCase() === 'georgia land bank city';
        case 'tax-sales':
          return ['sheriff sale', 'tax sale', 'tax deed', 'repository property'].includes((p.Acquisition_Type || '').toLowerCase()) || (p.Tax_Sale_Status || '').toLowerCase() === 'yes' || (p.Region_Tier || '').toLowerCase() === 'georgia county tax sale';
        case 'surplus':
          return (p.Acquisition_Type || '').toLowerCase().includes('surplus') || (p.Surplus_Property_Status || '').toLowerCase() === 'yes' || (p.Region_Tier || '').toLowerCase() === 'georgia surplus property';
        case 'best-deals':
          return parseScore(p.Fit_Score_0_to_100) >= 70;
        case 'highest-confidence':
          return parseScore(p.Data_Confidence_0_to_100 || '0') >= 80;
        case 'alert-worthy':
          return (p.Alert_Worthy || '').toLowerCase() === 'yes';
        case 'avoid-risk':
          return (p.Avoid_Flag || '').toLowerCase() === 'yes' || parseScore(p.Risk_Score_0_to_100) >= 60;
        case 'missing-data':
          return getPropertyWarnings(p).length > 0;
        case 'monetization':
          return parseScore(p.Monetization_Value_0_to_100 || '0') > 0;
        default:
          return true;
      }
    });
  }, [properties, currentSubTab]);

  const filteredProperties = useMemo(() => {
    const filtered = filterProperties(subTabFilteredProperties, filters);
    return sortProperties(filtered, sortConfig.key, sortConfig.direction);
  }, [subTabFilteredProperties, filters, sortConfig]);

  // Sort handler
  const handleSort = (key: keyof LandProperty) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Favorites
  const favoriteIds = useMemo(() => new Set(favorites.map(f => f.parcelId)), [favorites]);

  const handleToggleFavorite = useCallback((prop: LandProperty) => {
    const id = prop.Parcel_ID || prop.Property_Name_or_Address;
    setFavorites(prev => {
      const exists = prev.find(f => f.parcelId === id);
      const next = exists
        ? prev.filter(f => f.parcelId !== id)
        : [...prev, {
          parcelId: id,
          address: prop.Property_Name_or_Address,
          notes: '',
          addedAt: new Date().toISOString(),
        }];
      if (!exists) trackEvent('Engagement', 'favorite_saved', prop.Property_Name_or_Address);
      saveToLS(LS_FAVORITES, next);
      return next;
    });
  }, []);

  const handleRemoveFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.parcelId !== id);
      saveToLS(LS_FAVORITES, next);
      return next;
    });
  }, []);

  // Notes
  const handleNoteChange = useCallback((id: string, text: string) => {
    setNotes(prev => {
      const next = { ...prev, [id]: text };
      saveToLS(LS_NOTES, next);
      return next;
    });
  }, []);

  // Selection toggling for lead cards
  const handleToggleSelect = (p: LandProperty) => {
    const id = p.Listing_ID || p.Parcel_ID || p.Property_Name_or_Address;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const ids = filteredProperties.map(p => p.Listing_ID || p.Parcel_ID || p.Property_Name_or_Address);
    setSelectedIds(new Set(ids));
  };

  const handleSelectNone = () => {
    setSelectedIds(new Set());
  };

  // Lead Card Export
  const triggerLeadCardExport = (format: 'csv' | 'md' | 'html') => {
    if (!canExport(accessLevel)) {
      alert("Exports are available on Dashboard Pro ($79/mo) and Dashboard Investor ($149/mo). Visit /pricing to upgrade.");
      return;
    }
    const selectedProps = properties.filter(p =>
      selectedIds.has(p.Listing_ID || p.Parcel_ID || p.Property_Name_or_Address)
    );
    if (!selectedProps.length) return;
    trackEvent('Engagement', 'export_click', `Lead Cards (${format})`);
    if (format === 'csv') {
      exportToCSV(selectedProps, 'selected-leads.csv');
    } else if (format === 'md') {
      exportToMarkdown(selectedProps);
    } else if (format === 'html') {
      exportToHTML(selectedProps);
    }
  };

  // Exporters
  const handleExportAll = () => {
    if (!canExport(accessLevel)) return alert("Exports require Dashboard Pro ($79/mo) or Dashboard Investor ($149/mo). Visit /pricing to upgrade.");
    trackEvent('Engagement', 'export_click', 'All');
    exportToCSV(properties, 'georgia-land-all.csv');
  };
  const handleExportFiltered = () => {
    if (!canExport(accessLevel)) return alert("Exports require Dashboard Pro ($79/mo) or Dashboard Investor ($149/mo). Visit /pricing to upgrade.");
    trackEvent('Engagement', 'export_click', 'Filtered');
    exportToCSV(filteredProperties, 'georgia-land-filtered.csv');
  };
  const handleExportFavorites = () => {
    if (!canExport(accessLevel)) return alert("Exports require Dashboard Pro ($79/mo) or Dashboard Investor ($149/mo). Visit /pricing to upgrade.");
    trackEvent('Engagement', 'export_click', 'Favorites');
    const favIds = new Set(favorites.map(f => f.parcelId));
    const favProps = properties.filter(p => favIds.has(p.Parcel_ID || p.Property_Name_or_Address));
    exportToCSV(favProps, 'georgia-land-favorites.csv');
  };

  // Note fetching helper
  const selectedNote = selectedProperty
    ? notes[selectedProperty.Parcel_ID || selectedProperty.Property_Name_or_Address] || ''
    : '';

  // Stats Card Calculations
  const stats = useMemo(() => {
    const total = properties.length;
    const atlCore = properties.filter(p => (p.Region_Tier || '').toLowerCase() === 'atlanta core' || (p.City || '').toLowerCase() === 'atlanta').length;
    const metroAtl = properties.filter(p => (p.Region_Tier || '').toLowerCase() === 'metro-atlanta' || (p.Region_Tier || '').toLowerCase() === 'metro atlanta' || (p.Metro_Atlanta || '').toLowerCase() === 'yes').length;
    const lba = properties.filter(p => (p.Acquisition_Type || '').toLowerCase() === 'land bank' || (p.Land_Bank_Status || '').toLowerCase() === 'yes' || (p.Region_Tier || '').toLowerCase() === 'georgia land bank city').length;
    const taxSale = properties.filter(p => ['sheriff sale', 'tax sale', 'tax deed', 'repository property'].includes((p.Acquisition_Type || '').toLowerCase()) || (p.Tax_Sale_Status || '').toLowerCase() === 'yes').length;
    const surplus = properties.filter(p => (p.Acquisition_Type || '').toLowerCase().includes('surplus') || (p.Surplus_Property_Status || '').toLowerCase() === 'yes').length;
    
    const under50k = properties.filter(p => {
      const price = parsePrice(p.Estimated_Price_or_Min_Bid);
      return price !== null && price < 50000;
    }).length;

    const indAllowed = properties.filter(p => (p.Individual_Buyer_Allowed || '').toLowerCase() === 'yes').length;
    const npOnly = properties.filter(p => (p.Nonprofit_Only || '').toLowerCase() === 'yes').length;
    const alertWorthy = properties.filter(p => (p.Alert_Worthy || '').toLowerCase() === 'yes').length;

    const validFit = properties.filter(p => p.Fit_Score_0_to_100);
    const avgFit = validFit.length ? Math.round(validFit.reduce((sum, p) => sum + parseScore(p.Fit_Score_0_to_100 || '0'), 0) / validFit.length) : 0;

    const validRisk = properties.filter(p => p.Risk_Score_0_to_100);
    const avgRisk = validRisk.length ? Math.round(validRisk.reduce((sum, p) => sum + parseScore(p.Risk_Score_0_to_100 || '0'), 0) / validRisk.length) : 0;

    const validConf = properties.filter(p => p.Data_Confidence_0_to_100);
    const avgConf = validConf.length ? Math.round(validConf.reduce((sum, p) => sum + parseScore(p.Data_Confidence_0_to_100 || '0'), 0) / validConf.length) : 0;

    const validMonet = properties.filter(p => p.Monetization_Value_0_to_100);
    const avgMonet = validMonet.length ? Math.round(validMonet.reduce((sum, p) => sum + parseScore(p.Monetization_Value_0_to_100 || '0'), 0) / validMonet.length) : 0;

    // Metadata items
    const staleCount = properties.filter(p => (p.Source_Freshness || '').toLowerCase() === 'stale').length;
    const verifiedCount = properties.filter(p => (p.Researcher_Notes || '').toLowerCase().includes('needs verification') || (p.Parcel_ID || '').toLowerCase().includes('needs verification')).length;

    let latestResDate = 'N/A';
    const dates = properties.map(p => p.Date_Researched).filter(Boolean);
    if (dates.length) {
      latestResDate = dates.sort().reverse()[0] || 'N/A';
    }

    return {
      total, atlCore, metroAtl, lba, taxSale, surplus, under50k, indAllowed, npOnly, alertWorthy,
      avgFit, avgRisk, avgConf, avgMonet, staleCount, verifiedCount, latestResDate
    };
  }, [properties]);

  const subTabs = [
    { id: 'all', label: 'All Listings' },
    { id: 'atlanta-core', label: 'Atlanta Core' },
    { id: 'metro-atlanta', label: 'Metro Atlanta' },
    { id: 'land-banks', label: 'Georgia Land Banks' },
    { id: 'tax-sales', label: 'Tax Sales' },
    { id: 'surplus', label: 'Surplus Properties' },
    { id: 'best-deals', label: 'Best Deals' },
    { id: 'highest-confidence', label: 'Highest Confidence' },
    { id: 'alert-worthy', label: 'Alert Worthy' },
    { id: 'avoid-risk', label: 'Avoid / High Risk' },
    { id: 'missing-data', label: 'Missing Data / Warnings' },
    { id: 'monetization', label: 'Monetization View' },
  ];

  return (
    <div className="min-h-screen bg-olive-950 text-olive-50 font-sans pb-16">
      <SEO 
        title="Land Database Dashboard"
        description="Search, filter, and analyze Georgia low-cost land opportunities."
        noindex={true}
      />
      <Header
        totalCount={properties.length}
        filteredCount={filteredProperties.length}
        favoritesCount={favorites.length}
        onExportAll={handleExportAll}
        onExportFiltered={handleExportFiltered}
        onExportFavorites={handleExportFavorites}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="max-w-screen-2xl mx-auto px-4 py-6">
        {/* Dashboard tab */}
        {activeTab === 'dashboard' && (() => {
          // Sponsors configuration
          const activeSidebarSponsors = sponsors.filter(s => s.active && s.placements.includes('sidebar'));
          const hasSponsors = activeSidebarSponsors.length > 0;

          return (
          <div
            className={hasSponsors
              ? 'grid xl:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start'
              : 'block'
            }
          >
            {/* ── Main content column ── */}
            <div className="min-w-0 overflow-hidden space-y-6">
            {/* Upgrade Banner for Free Users */}
            {!canViewFullDatabase(accessLevel) && (
              <div className="bg-accent-warning/20 border border-accent-warning/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-accent-warning font-bold text-lg">Free Preview Mode</h3>
                  <p className="text-olive-300 text-sm mt-1">You are viewing {getMaxRowsAllowed(accessLevel) || 10} sample properties. Upgrade to access the full 10,000+ lead database.</p>
                </div>
                <a href={(import.meta.env as Record<string, string>).VITE_DASHBOARD_STARTER_CHECKOUT_URL || '/pricing'} onClick={() => trackEvent('Sales', 'upgrade_click', 'Free Preview Banner')} className="btn-primary shrink-0 bg-accent-warning text-olive-950 hover:bg-yellow-400 border-none whitespace-nowrap shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                  Unlock Database ($39/mo)
                </a>
              </div>
            )}

            {/* Metadata bar */}
            <div className="bg-olive-900/60 border border-surface-border rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-olive-400">
                  <FileText size={13} className="text-brand-500" />
                  Source File: <strong className="text-olive-100">{loadedFilename}</strong>
                </span>
                <span className="text-olive-600">|</span>
                <span className="text-olive-400">
                  Total Rows: <strong className="text-brand-400 font-mono">{stats.total}</strong>
                </span>
                <span className="text-olive-600">|</span>
                <span className="text-olive-400">
                  Latest Research Date: <strong className="text-olive-100 font-mono">{stats.latestResDate}</strong>
                </span>
              </div>
              <div className="flex items-center gap-4">
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

            {/* Summary Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: 'Total Listings', value: stats.total, sub: 'Enriched' },
                { label: 'Atlanta Core', value: stats.atlCore, sub: 'In-city' },
                { label: 'Metro Atlanta', value: stats.metroAtl, sub: '10 Counties' },
                { label: 'Georgia Land Banks', value: stats.lba, sub: 'LBA program' },
                { label: 'Tax Sale', value: stats.taxSale, sub: 'Sheriff auction' },
                { label: 'Surplus Lots', value: stats.surplus, sub: 'Gov owned' },
                { label: 'Under $50K', value: stats.under50k, sub: 'Budget focus' },
                { label: 'Ind. Eligible', value: stats.indAllowed, sub: 'General buyers' },
                { label: 'Nonprofit Only', value: stats.npOnly, sub: 'Restricted' },
                { label: 'Alert Worthy', value: stats.alertWorthy, sub: 'Hot Deals' },
                { label: 'Avg Fit Score', value: `${stats.avgFit}%`, sub: 'Out of 100', highlight: 'text-brand-400' },
                { label: 'Avg Risk Score', value: `${stats.avgRisk}%`, sub: 'Out of 100', highlight: 'text-accent-warning' },
                { label: 'Avg Data Conf.', value: `${stats.avgConf}%`, sub: 'Out of 100', highlight: 'text-blue-400' },
                { label: 'Avg Monetization', value: `${stats.avgMonet}%`, sub: 'Commercial value', highlight: 'text-purple-400' },
              ].map((card, i) => (
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

            {/* Filter panel */}
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              properties={properties}
            />

            {/* Sub-tabs horizontal scroll bar */}
            <div className="flex gap-1.5 border-b border-surface-border overflow-x-auto pb-1">
              {subTabs.map(tab => {
                const count = properties.filter(p => {
                  switch (tab.id) {
                    case 'atlanta-core':
                      return (p.Region_Tier || '').toLowerCase() === 'atlanta core' || (p.City || '').toLowerCase() === 'atlanta';
                    case 'metro-atlanta':
                      return (p.Region_Tier || '').toLowerCase() === 'metro-atlanta' || (p.Region_Tier || '').toLowerCase() === 'metro atlanta' || (p.Metro_Atlanta || '').toLowerCase() === 'yes';
                    case 'land-banks':
                      return (p.Acquisition_Type || '').toLowerCase() === 'land bank' || (p.Land_Bank_Status || '').toLowerCase() === 'yes' || (p.Region_Tier || '').toLowerCase() === 'georgia land bank city';
                    case 'tax-sales':
                      return ['sheriff sale', 'tax sale', 'tax deed', 'repository property'].includes((p.Acquisition_Type || '').toLowerCase()) || (p.Tax_Sale_Status || '').toLowerCase() === 'yes' || (p.Region_Tier || '').toLowerCase() === 'georgia county tax sale';
                    case 'surplus':
                      return (p.Acquisition_Type || '').toLowerCase().includes('surplus') || (p.Surplus_Property_Status || '').toLowerCase() === 'yes' || (p.Region_Tier || '').toLowerCase() === 'georgia surplus property';
                    case 'best-deals':
                      return parseScore(p.Fit_Score_0_to_100) >= 70;
                    case 'highest-confidence':
                      return parseScore(p.Data_Confidence_0_to_100 || '0') >= 80;
                    case 'alert-worthy':
                      return (p.Alert_Worthy || '').toLowerCase() === 'yes';
                    case 'avoid-risk':
                      return (p.Avoid_Flag || '').toLowerCase() === 'yes' || parseScore(p.Risk_Score_0_to_100) >= 60;
                    case 'missing-data':
                      return getPropertyWarnings(p).length > 0;
                    default:
                      return true;
                  }
                }).length;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCurrentSubTab(tab.id);
                      if (tab.id === 'monetization') {
                        setViewMode('table');
                      }
                    }}
                    className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
                      currentSubTab === tab.id
                        ? 'border-brand-500 text-brand-400 bg-brand-950/15'
                        : 'border-transparent text-olive-500 hover:text-olive-200'
                    }`}
                  >
                    {tab.label}
                    {tab.id !== 'all' && (
                      <span className="bg-olive-800 text-[10px] text-olive-400 px-1.5 py-0.2 rounded-full font-mono font-bold">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* View mode toggle */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-olive-500">
                Showing <span className="text-brand-400 font-mono font-medium">{filteredProperties.length}</span>
                {' '}of {subTabFilteredProperties.length} listings in category
              </p>
              {currentSubTab !== 'monetization' && (
                <div className="flex items-center gap-1 bg-olive-900 border border-surface-border rounded-lg p-1">
                  {[
                    { mode: 'table' as ViewMode, icon: <List size={13} />, label: 'Table' },
                    { mode: 'card' as ViewMode, icon: <LayoutGrid size={13} />, label: 'Cards' },
                    { mode: 'map' as ViewMode, icon: <Map size={13} />, label: 'Map' },
                  ].map(({ mode, icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                        viewMode === mode
                          ? 'bg-brand-600 text-white'
                          : 'text-olive-500 hover:text-olive-100'
                      }`}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selection actions for export */}
            {filteredProperties.length > 0 && (
              <div className="flex justify-end gap-2 text-xs">
                <button onClick={handleSelectAll} className="btn-ghost flex items-center gap-1 px-2.5 py-1 text-olive-400 hover:text-white border-surface-border hover:border-olive-700">
                  <CheckSquare size={13} /> Select All
                </button>
                <button onClick={handleSelectNone} className="btn-ghost flex items-center gap-1 px-2.5 py-1 text-olive-400 hover:text-white border-surface-border hover:border-olive-700">
                  <Square size={13} /> Select None
                </button>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="card flex items-center justify-center h-48 gap-3">
                <Loader2 size={20} className="animate-spin text-brand-500" />
                <span className="text-olive-500">Loading CSV data...</span>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="card border-accent-warning/40 bg-yellow-900/10 flex items-start gap-3">
                <AlertCircle size={18} className="text-accent-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-accent-warning font-medium text-sm">No data loaded</p>
                  <p className="text-yellow-700 text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Views rendering */}
            {!loading && !error && (
              <>
                {/* Special Monetization View */}
                {currentSubTab === 'monetization' ? (
                  <div className="card p-0 overflow-hidden border border-purple-900/30">
                    <div className="bg-purple-950/20 px-4 py-3 border-b border-surface-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="text-purple-400" size={16} />
                        <span className="font-bold text-xs text-white">Paid Product Commercial Monetization Matrix</span>
                      </div>
                      <span className="text-[10px] text-purple-400 font-medium font-mono">High Monetization Focus</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-surface-border bg-olive-900/50">
                            <th className="w-8 px-3 py-2 text-left"></th>
                            <th className="px-3 py-2.5 text-left text-olive-400 font-medium">Rank</th>
                            <th className="px-3 py-2.5 text-left text-olive-400 font-medium">Address</th>
                            <th className="px-3 py-2.5 text-left text-olive-400 font-medium">Location</th>
                            <th className="px-3 py-2.5 text-left text-olive-400 font-medium">Price</th>
                            <th className="px-3 py-2.5 text-left text-olive-400 font-medium text-purple-400">Monetization Score</th>
                            <th className="px-3 py-2.5 text-left text-olive-400 font-medium">Marketing Hook</th>
                            <th className="px-3 py-2.5 text-left text-olive-400 font-medium">Buyer Profile</th>
                            <th className="px-3 py-2.5 text-left text-olive-400 font-medium">Deal Type</th>
                            <th className="px-3 py-2.5 text-left text-olive-400 font-medium">Alert</th>
                            <th className="px-3 py-2.5 text-left text-olive-400 font-medium">Data Conf.</th>
                            <th className="px-3 py-2.5 text-left text-olive-400 font-medium">Freshness</th>
                            <th className="px-3 py-2.5 text-left text-olive-400 font-medium">Recommended Next Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProperties.length === 0 ? (
                            <tr>
                              <td colSpan={13} className="text-center py-10 text-olive-500">No listings match filters</td>
                            </tr>
                          ) : (
                            filteredProperties.map((p, idx) => {
                              const pId = p.Listing_ID || p.Parcel_ID || p.Property_Name_or_Address;
                              const isSel = selectedIds.has(pId);
                              const monetScore = parseScore(p.Monetization_Value_0_to_100 || '0');
                              return (
                                <tr
                                  key={idx}
                                  onClick={() => {
                                    setSelectedProperty(p);
                                    trackEvent('Engagement', 'listing_view', p.Property_Name_or_Address);
                                  }}
                                  className="table-row-hover border-b border-surface-border/50 hover:bg-purple-950/5 cursor-pointer"
                                >
                                  <td className="px-3 py-2" onClick={e => { e.stopPropagation(); handleToggleSelect(p); }}>
                                    <input
                                      type="checkbox"
                                      checked={isSel}
                                      onChange={() => {}} // Handled by td onClick
                                      className="rounded bg-olive-800 border-olive-700 text-brand-600 focus:ring-brand-600"
                                    />
                                  </td>
                                  <td className="px-3 py-2 font-mono text-brand-400 font-medium">#{p.Priority_Rank}</td>
                                  <td className="px-3 py-2 font-medium text-white max-w-[150px] truncate" title={p.Property_Name_or_Address}>
                                    {p.Property_Name_or_Address}
                                  </td>
                                  <td className="px-3 py-2 text-olive-400">{p.City}, {p.County}</td>
                                  <td className="px-3 py-2 text-brand-400 font-mono font-medium">{p.Estimated_Price_or_Min_Bid}</td>
                                  <td className="px-3 py-2">
                                    <span className="badge bg-purple-900/30 text-purple-300 border border-purple-800 font-mono font-medium">
                                      {monetScore}%
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-olive-400 max-w-[180px] truncate" title={p.Content_Marketing_Angle}>
                                    {p.Content_Marketing_Angle || 'N/A'}
                                  </td>
                                  <td className="px-3 py-2 text-olive-200 font-medium">{p.Buyer_Profile || 'N/A'}</td>
                                  <td className="px-3 py-2 text-olive-400">{p.Deal_Type || 'N/A'}</td>
                                  <td className="px-3 py-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      (p.Alert_Worthy || '').toLowerCase() === 'yes'
                                        ? 'bg-brand-950 text-brand-400 border border-brand-800'
                                        : 'bg-olive-800 text-olive-500'
                                    }`}>
                                      {p.Alert_Worthy || 'No'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 font-mono">{p.Data_Confidence_0_to_100 || 'N/A'}%</td>
                                  <td className="px-3 py-2">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                      (p.Source_Freshness || '').toLowerCase() === 'current'
                                        ? 'bg-green-900/30 text-brand-400'
                                        : 'bg-olive-800 text-olive-400'
                                    }`}>
                                      {p.Source_Freshness || 'Unknown'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-olive-400 max-w-[150px] truncate" title={p.Recommended_Next_Action}>
                                    {p.Recommended_Next_Action}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Standard Table View — grouped property listing */}
                    {viewMode === 'table' && (
                      <PropertyTable
                        properties={filteredProperties}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        onRowClick={(p) => {
                          setSelectedProperty(p);
                          trackEvent('Engagement', 'listing_view', p.Property_Name_or_Address);
                        }}
                        favorites={favoriteIds}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    )}

                    {viewMode === 'card' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProperties.length === 0 ? (
                          <div className="col-span-full card flex items-center justify-center h-48 text-olive-600">
                            No properties match the current filters.
                          </div>
                        ) : (
                          filteredProperties.map((prop, idx) => {
                            const id = prop.Parcel_ID || prop.Property_Name_or_Address;
                            const pId = prop.Listing_ID || prop.Parcel_ID || prop.Property_Name_or_Address;
                            const isSel = selectedIds.has(pId);
                            return (
                              <div key={idx} className="relative group">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSelect(prop);
                                  }}
                                  className="absolute top-3 left-3 bg-olive-900/80 hover:bg-olive-800 border border-olive-700 p-1.5 rounded-lg z-30 transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSel}
                                    onChange={() => {}}
                                    className="rounded bg-olive-800 border-olive-700 text-brand-600 focus:ring-brand-600 cursor-pointer"
                                  />
                                </button>
                                <PropertyCard
                                  property={prop}
                                  onClick={() => {
                                    setSelectedProperty(prop);
                                    trackEvent('Engagement', 'listing_view', prop.Property_Name_or_Address);
                                  }}
                                  isFavorite={favoriteIds.has(id)}
                                  onToggleFavorite={e => { e.stopPropagation(); handleToggleFavorite(prop); }}
                                />
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {viewMode === 'map' && (
                      <React.Suspense fallback={
                        <div className="card flex items-center justify-center h-64 gap-3">
                          <Loader2 size={18} className="animate-spin text-brand-500" />
                          <span className="text-olive-500">Loading map...</span>
                        </div>
                      }>
                        <MapView
                          properties={filteredProperties}
                          onPropertyClick={(p) => {
                            setSelectedProperty(p);
                            trackEvent('Engagement', 'listing_view', p.Property_Name_or_Address);
                          }}
                          favoriteIds={favoriteIds}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      </React.Suspense>
                    )}
                  </>
                )}
              </>
            )}
            </div>
            {/* ── Sponsor sidebar ── */}
            {hasSponsors && (
              <aside className="w-full xl:w-[280px] xl:min-w-[280px] xl:max-w-[280px] shrink-0 space-y-4 xl:sticky xl:top-20 xl:self-start">
                {activeSidebarSponsors.map((s) => (
                  <SponsorBanner
                    key={s.id}
                    sponsor={s}
                  />
                ))}
              </aside>
            )}
          </div>
          );
        })()}

        {/* Analytics tab */}
        {activeTab === 'analytics' && !loading && (
          <div className="mt-6">
            <Analytics properties={filteredProperties.length > 0 ? filteredProperties : properties} />
          </div>
        )}

        {/* Data Quality tab */}
        {activeTab === 'data-quality' && !loading && (
          <div className="mt-6">
            <DataQuality properties={properties} onRowClick={setSelectedProperty} />
          </div>
        )}

        {/* Favorites tab */}
        {activeTab === 'favorites' && (
          <div className="mt-6">
            {!canUseFavorites(accessLevel) ? (
              <div className="card p-12 text-center max-w-2xl mx-auto mt-12 border-brand-900/50">
                <div className="w-16 h-16 bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="text-brand-500" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 font-display">Favorites & Notes Locked</h2>
                <p className="text-olive-300 mb-6">
                  Saving favorites, adding notes, and exporting lead cards is available on the Dashboard Pro tier.
                </p>
                <a href={import.meta.env.VITE_DASHBOARD_PRO_CHECKOUT_URL || '/pricing'} className="btn-primary bg-brand-500 hover:bg-brand-400 text-olive-950 mx-auto inline-flex items-center">
                  Upgrade to Pro ($79/mo)
                </a>
              </div>
            ) : (
              <FavoritesView
                properties={properties}
                favorites={favorites}
                notes={notes}
                onRowClick={setSelectedProperty}
                onRemoveFavorite={handleRemoveFavorite}
              />
            )}
          </div>
        )}

        {/* Agency Contacts tab */}
        {activeTab === 'agency-contacts' && !loading && (
          <div className="mt-6">
            {!canUseInvestorTools(accessLevel) ? (
              <div className="card p-12 text-center max-w-2xl mx-auto mt-12 border-brand-900/50">
                <div className="w-16 h-16 bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-brand-500" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 font-display">Agency Contacts Locked</h2>
                <p className="text-olive-300 mb-6">
                  Direct agency contacts, zoning officials, and priority deal workflows are exclusive to the Dashboard Investor tier.
                </p>
                <a href={import.meta.env.VITE_DASHBOARD_INVESTOR_CHECKOUT_URL || '/pricing'} className="btn-primary bg-brand-500 hover:bg-brand-400 text-olive-950 mx-auto inline-flex items-center">
                  Upgrade to Investor ($149/mo)
                </a>
              </div>
            ) : (
              <AgencyContacts
                properties={properties}
                onPropertyClick={setSelectedProperty}
              />
            )}
          </div>
        )}
      </main>

      {/* Property detail drawer */}
      {selectedProperty && (
        <PropertyDrawer
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          isFavorite={favoriteIds.has(selectedProperty.Parcel_ID || selectedProperty.Property_Name_or_Address)}
          onToggleFavorite={handleToggleFavorite}
          note={selectedNote}
          onNoteChange={handleNoteChange}
        />
      )}

      {/* Floating Lead Card Selection Export panel */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 right-6 bg-olive-900 border border-brand-800 shadow-2xl p-4 rounded-xl flex flex-col sm:flex-row items-center gap-3 z-50 animate-bounce-subtle max-w-sm sm:max-w-xl">
          <div className="flex flex-col">
            <span className="text-xs text-white font-bold font-mono">
              {selectedIds.size} Lead{selectedIds.size > 1 ? 's' : ''} Selected
            </span>
            <span className="text-[10px] text-olive-500">{canExport(accessLevel) ? 'Ready to export lead cards' : 'Export requires Pro ($79/mo)'}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => triggerLeadCardExport('csv')} className="bg-green-700 hover:bg-brand-600 text-white font-medium text-xs px-2.5 py-1.5 rounded-lg transition-colors">Export CSV</button>
            <button onClick={() => triggerLeadCardExport('md')} className="bg-blue-700 hover:bg-blue-600 text-white font-medium text-xs px-2.5 py-1.5 rounded-lg transition-colors">Export MD</button>
            <button onClick={() => triggerLeadCardExport('html')} className="bg-purple-700 hover:bg-purple-600 text-white font-medium text-xs px-2.5 py-1.5 rounded-lg transition-colors">Export HTML</button>
            <button onClick={handleSelectNone} className="bg-olive-800 hover:bg-olive-700 text-olive-200 font-medium text-xs px-2.5 py-1.5 rounded-lg transition-colors">Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
