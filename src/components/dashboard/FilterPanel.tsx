import React, { useState } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { Filters, LandProperty } from '../../types';
import { getUniqueValues } from '../../utils';
import { trackEvent } from '../../lib/analytics';

interface FilterPanelProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  properties: LandProperty[];
}

export default function FilterPanel({ filters, onChange, properties }: FilterPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const cities = getUniqueValues(properties, 'City');
  const counties = getUniqueValues(properties, 'County');
  const acquisitionTypes = getUniqueValues(properties, 'Acquisition_Type');
  const priceCategories = getUniqueValues(properties, 'Price_Category');
  const zonings = getUniqueValues(properties, 'Zoning');
  const propertyTypes = getUniqueValues(properties, 'Property_Type');

  // Enriched Dropdown Values
  const regionTiers = getUniqueValues(properties, 'Region_Tier');
  const metroAreas = getUniqueValues(properties, 'Metro_Area');
  const dealTypes = getUniqueValues(properties, 'Deal_Type');
  const buyerProfiles = getUniqueValues(properties, 'Buyer_Profile');
  const sourceFreshnessOptions = getUniqueValues(properties, 'Source_Freshness');
  const readinessOptions = getUniqueValues(properties, 'Estimated_Development_Readiness');
  const eligibleBuyerTypes = getUniqueValues(properties, 'Eligible_Buyer_Type');

  const update = (partial: Partial<Filters>) => {
    Object.keys(partial).forEach(key => trackEvent('Engagement', 'filter_used', key));
    onChange({ ...filters, ...partial });
  };

  const hasActiveFilters =
    filters.search || filters.city || filters.county || filters.acquisitionType ||
    filters.priceCategory || filters.zoning || filters.propertyType ||
    filters.regionTier || filters.metroArea || filters.dealType ||
    filters.buyerProfile || filters.sourceFreshness || filters.readiness ||
    filters.eligibleBuyerType || filters.individualBuyerAllowed || filters.nonprofitOnly ||
    filters.builderRequired || filters.alertWorthy || filters.avoidFlag ||
    filters.fitScoreMin > 0 || filters.fitScoreMax < 100 ||
    filters.riskScoreMin > 0 || filters.riskScoreMax < 100 ||
    filters.dataConfidenceMin > 0 || filters.dataConfidenceMax < 100 ||
    filters.monetizationValueMin > 0 || filters.monetizationValueMax < 100 ||
    filters.under50k || filters.atlantaOnly || filters.metroAtlantaOnly ||
    filters.lowRiskOnly || filters.needsVerification ||
    filters.priceMin > 0 || filters.priceMax > 0 ||
    filters.pricePerAcreMin > 0 || filters.pricePerAcreMax > 0 ||
    filters.sourceType || filters.listingStatus ||
    filters.valueScoreMin > 0;

  const resetFilters = () => onChange({
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
    priceMin: 0, priceMax: 0,
    pricePerAcreMin: 0, pricePerAcreMax: 0,
    sourceType: '', listingStatus: '',
    valueScoreMin: 0,
  });

  return (
    <div className="bg-olive-900 border border-surface-border rounded-xl shadow-lg">
      {/* Search bar + toggle */}
      <div className="flex items-center gap-2 p-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-500" />
          <input
            type="text"
            placeholder="Search address, city, county, parcel ID, deal type, buyer profile..."
            value={filters.search}
            onChange={e => update({ search: e.target.value })}
            className="input w-full pl-8 text-sm"
          />
          {filters.search && (
            <button
              onClick={() => update({ search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-olive-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`btn-ghost flex items-center gap-1.5 text-sm whitespace-nowrap ${expanded || hasActiveFilters ? 'text-brand-400 border-brand-800 bg-brand-950/20' : ''}`}
        >
          <SlidersHorizontal size={14} />
          Filters
          {hasActiveFilters && (
            <span className="bg-brand-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">!</span>
          )}
          <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {hasActiveFilters && (
          <button onClick={resetFilters} className="btn-danger text-xs whitespace-nowrap">
            <X size={12} /> Reset
          </button>
        )}
      </div>

      {/* Quick filter toggles */}
      <div className="px-3 pb-3 flex flex-wrap gap-2">
        {[
          { key: 'under50k', label: 'Under $50K' },
          { key: 'atlantaOnly', label: 'Atlanta Only' },
          { key: 'metroAtlantaOnly', label: 'Metro Atlanta' },
          { key: 'lowRiskOnly', label: 'Low Risk' },
          { key: 'needsVerification', label: 'Needs Verification/Warnings' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => update({ [key]: !filters[key as keyof Filters] })}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              filters[key as keyof Filters]
                ? 'bg-brand-600 border-brand-500 text-white'
                : 'bg-olive-800 border-olive-700 text-olive-400 hover:border-gray-500 hover:text-olive-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="border-t border-surface-border p-4 space-y-4 animate-fade-in">
          {/* Dropdowns Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {/* Core geographic options */}
            <div>
              <label className="block text-xs text-olive-500 mb-1">Region Tier</label>
              <select
                value={filters.regionTier}
                onChange={e => update({ regionTier: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All Tiers</option>
                {regionTiers.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-olive-500 mb-1">Metro Area</label>
              <select
                value={filters.metroArea}
                onChange={e => update({ metroArea: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All Metros</option>
                {metroAreas.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-olive-500 mb-1">County</label>
              <select
                value={filters.county}
                onChange={e => update({ county: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All Counties</option>
                {counties.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-olive-500 mb-1">City</label>
              <select
                value={filters.city}
                onChange={e => update({ city: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All Cities</option>
                {cities.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Deal Type & Buyer Profile */}
            <div>
              <label className="block text-xs text-olive-500 mb-1">Acquisition Type</label>
              <select
                value={filters.acquisitionType}
                onChange={e => update({ acquisitionType: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All Types</option>
                {acquisitionTypes.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-olive-500 mb-1">Deal Type</label>
              <select
                value={filters.dealType}
                onChange={e => update({ dealType: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All Deal Types</option>
                {dealTypes.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-olive-500 mb-1">Buyer Profile</label>
              <select
                value={filters.buyerProfile}
                onChange={e => update({ buyerProfile: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All Profiles</option>
                {buyerProfiles.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-olive-500 mb-1">Price Category</label>
              <select
                value={filters.priceCategory}
                onChange={e => update({ priceCategory: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All Prices</option>
                {priceCategories.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-olive-500 mb-1">Source Freshness</label>
              <select
                value={filters.sourceFreshness}
                onChange={e => update({ sourceFreshness: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All Freshness</option>
                {sourceFreshnessOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-olive-500 mb-1">Development Readiness</label>
              <select
                value={filters.readiness}
                onChange={e => update({ readiness: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All Readiness</option>
                {readinessOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Eligibility dropdowns */}
            <div>
              <label className="block text-xs text-olive-500 mb-1">Eligible Buyer Type</label>
              <select
                value={filters.eligibleBuyerType}
                onChange={e => update({ eligibleBuyerType: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All Types</option>
                {eligibleBuyerTypes.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-olive-500 mb-1">Individual Buyer Allowed?</label>
              <select
                value={filters.individualBuyerAllowed}
                onChange={e => update({ individualBuyerAllowed: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-olive-500 mb-1">Nonprofit Only?</label>
              <select
                value={filters.nonprofitOnly}
                onChange={e => update({ nonprofitOnly: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-olive-500 mb-1">Builder Required Before Close?</label>
              <select
                value={filters.builderRequired}
                onChange={e => update({ builderRequired: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* Flags */}
            <div>
              <label className="block text-xs text-olive-500 mb-1">Alert Worthy?</label>
              <select
                value={filters.alertWorthy}
                onChange={e => update({ alertWorthy: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-olive-500 mb-1">Avoid / High Risk?</label>
              <select
                value={filters.avoidFlag}
                onChange={e => update({ avoidFlag: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-olive-500 mb-1">Zoning Class</label>
              <select
                value={filters.zoning}
                onChange={e => update({ zoning: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All Zonings</option>
                {zonings.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-olive-500 mb-1">Property Type</label>
              <select
                value={filters.propertyType}
                onChange={e => update({ propertyType: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All Types</option>
                {propertyTypes.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Ranges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-surface-border pt-3">
            {/* Fit Score range */}
            <div>
              <label className="block text-xs text-olive-500 mb-1">
                Fit Score: <span className="text-brand-400 font-mono font-bold">{filters.fitScoreMin}–{filters.fitScoreMax}</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="range" min={0} max={100}
                  value={filters.fitScoreMin}
                  onChange={e => update({ fitScoreMin: +e.target.value })}
                  className="flex-1 accent-green-500"
                />
                <input
                  type="range" min={0} max={100}
                  value={filters.fitScoreMax}
                  onChange={e => update({ fitScoreMax: +e.target.value })}
                  className="flex-1 accent-green-500"
                />
              </div>
            </div>

            {/* Risk Score range */}
            <div>
              <label className="block text-xs text-olive-500 mb-1">
                Risk Score: <span className="text-accent-warning font-mono font-bold">{filters.riskScoreMin}–{filters.riskScoreMax}</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="range" min={0} max={100}
                  value={filters.riskScoreMin}
                  onChange={e => update({ riskScoreMin: +e.target.value })}
                  className="flex-1 accent-yellow-500"
                />
                <input
                  type="range" min={0} max={100}
                  value={filters.riskScoreMax}
                  onChange={e => update({ riskScoreMax: +e.target.value })}
                  className="flex-1 accent-yellow-500"
                />
              </div>
            </div>

            {/* Data Confidence range */}
            <div>
              <label className="block text-xs text-olive-500 mb-1">
                Data Confidence: <span className="text-blue-400 font-mono font-bold">{filters.dataConfidenceMin}–{filters.dataConfidenceMax}</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="range" min={0} max={100}
                  value={filters.dataConfidenceMin}
                  onChange={e => update({ dataConfidenceMin: +e.target.value })}
                  className="flex-1 accent-blue-500"
                />
                <input
                  type="range" min={0} max={100}
                  value={filters.dataConfidenceMax}
                  onChange={e => update({ dataConfidenceMax: +e.target.value })}
                  className="flex-1 accent-blue-500"
                />
              </div>
            </div>

            {/* Monetization Value range */}
            <div>
              <label className="block text-xs text-olive-500 mb-1">
                Monetization Value: <span className="text-purple-400 font-mono font-bold">{filters.monetizationValueMin}–{filters.monetizationValueMax}</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="range" min={0} max={100}
                  value={filters.monetizationValueMin}
                  onChange={e => update({ monetizationValueMin: +e.target.value })}
                  className="flex-1 accent-purple-500"
                />
                <input
                  type="range" min={0} max={100}
                  value={filters.monetizationValueMax}
                  onChange={e => update({ monetizationValueMax: +e.target.value })}
                  className="flex-1 accent-purple-500"
                />
              </div>
            </div>
          </div>

          {/* New Search & Source Filters */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 border-t border-surface-border pt-3">
            {/* Price Presets */}
            <div className="col-span-2">
              <label className="block text-xs text-olive-500 mb-1">Price Presets</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => update({ priceMin: 0, priceMax: 10000 })}
                  className="px-3 py-1 bg-olive-800 hover:bg-olive-700 text-olive-200 text-xs rounded-full border border-olive-700 transition-colors"
                >
                  Under $10k
                </button>
                <button
                  onClick={() => update({ priceMin: 10000, priceMax: 50000 })}
                  className="px-3 py-1 bg-olive-800 hover:bg-olive-700 text-olive-200 text-xs rounded-full border border-olive-700 transition-colors"
                >
                  $10k - $50k
                </button>
                <button
                  onClick={() => update({ priceMin: 50000, priceMax: 100000 })}
                  className="px-3 py-1 bg-olive-800 hover:bg-olive-700 text-olive-200 text-xs rounded-full border border-olive-700 transition-colors"
                >
                  $50k - $100k
                </button>
                <button
                  onClick={() => update({ priceMin: 100000, priceMax: 0 })}
                  className="px-3 py-1 bg-olive-800 hover:bg-olive-700 text-olive-200 text-xs rounded-full border border-olive-700 transition-colors"
                >
                  $100k+
                </button>
                <button
                  onClick={() => update({ priceMin: 0, priceMax: 0 })}
                  className="px-3 py-1 bg-olive-800 hover:bg-olive-700 text-olive-200 text-xs rounded-full border border-olive-700 transition-colors"
                >
                  Any Price
                </button>
              </div>
            </div>

            {/* Custom Price Range */}
            <div className="col-span-2 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-olive-500 mb-1">Custom Price Min ($)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={filters.priceMin || ''}
                  onChange={e => update({ priceMin: +e.target.value })}
                  className="input w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-olive-500 mb-1">Custom Price Max ($)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Any"
                  value={filters.priceMax || ''}
                  onChange={e => update({ priceMax: +e.target.value })}
                  className="input w-full text-sm"
                />
              </div>
            </div>

            {/* Price Per Acre Range */}
            <div>
              <label className="block text-xs text-olive-500 mb-1">Price/Acre Min ($/ac)</label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={filters.pricePerAcreMin || ''}
                onChange={e => update({ pricePerAcreMin: +e.target.value })}
                className="input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-olive-500 mb-1">Price/Acre Max ($/ac)</label>
              <input
                type="number"
                min={0}
                placeholder="Any"
                value={filters.pricePerAcreMax || ''}
                onChange={e => update({ pricePerAcreMax: +e.target.value })}
                className="input w-full text-sm"
              />
            </div>

            {/* Source Type */}
            <div>
              <label className="block text-xs text-olive-500 mb-1">Source Type</label>
              <select
                value={filters.sourceType}
                onChange={e => update({ sourceType: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All</option>
                <option value="Land-Bank">Land-Bank</option>
                <option value="Tax-Sale">Tax-Sale</option>
                <option value="Surplus">Surplus</option>
                <option value="MLS-Style">MLS-Style</option>
                <option value="GIS-Parcel">GIS-Parcel</option>
                <option value="Off-Market">Off-Market</option>
              </select>
            </div>

            {/* Listing Status */}
            <div>
              <label className="block text-xs text-olive-500 mb-1">Listing Status</label>
              <select
                value={filters.listingStatus}
                onChange={e => update({ listingStatus: e.target.value })}
                className="select w-full text-sm"
              >
                <option value="">All</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Sold">Sold</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            {/* Value Score Min slider */}
            <div className="col-span-2">
              <label className="block text-xs text-olive-500 mb-1">
                Value Score Min: <span className="text-brand-400 font-mono font-bold">{filters.valueScoreMin}</span>
              </label>
              <input
                type="range" min={0} max={100}
                value={filters.valueScoreMin}
                onChange={e => update({ valueScoreMin: +e.target.value })}
                className="w-full accent-green-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
