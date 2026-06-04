import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Bell, CheckCircle2, ArrowRight } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import SponsorBanner from '../components/marketing/SponsorBanner';
import SEO from '../components/SEO';
import { sponsors } from '../data/sponsors';

export default function AlertsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [counties, setCounties] = useState('');
  const [maxPrice, setMaxPrice] = useState('Any');
  const [minFitScore, setMinFitScore] = useState('50');
  const [acquisitionTypes, setAcquisitionTypes] = useState<string[]>([]);
  
  const alertSponsors = sponsors.filter(s => s.active && s.placements.includes('alert_email'));

  const handleAcquisitionTypeToggle = (type: string) => {
    setAcquisitionTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    trackEvent('Marketing', 'alert signup', 'Alerts Page');

    try {
      const response = await fetch('/api/save-alert-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          counties,
          max_price_category: maxPrice,
          min_fit_score: minFitScore,
          acquisition_types: acquisitionTypes
        })
      });

      if (response.ok) {
        setSubmitted(true);
        trackEvent('Marketing', 'alert preferences saved', 'Alerts Page');
      } else {
        console.error('Failed to save alert preferences');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-olive-950 text-olive-50 font-sans">
      <SEO 
        title="Weekly Land Deal Alerts | Georgia Land Finder"
        description="Subscribe to get the best Georgia land deals sent directly to your inbox every week. Filter by county, price, and acquisition type."
        canonicalUrl="https://georgialandfinder.com/alerts"
      />
      <nav className="border-b border-surface-border bg-olive-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Layers className="text-brand-500" size={24} />
            <span className="font-display font-bold text-lg text-white tracking-tight">Georgia Land Finder</span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <Link to="/pricing" className="text-olive-300 hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>
      </nav>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 tracking-tight">
              Georgia Land Alerts
            </h1>
            <p className="text-lg text-olive-400">
              Set your preferences and never miss a new low-cost property hitting the market.
            </p>
          </div>

          {submitted ? (
            <div className="panel p-12 text-center max-w-lg mx-auto">
              <CheckCircle2 className="text-brand-500 mx-auto mb-6" size={48} />
              <h3 className="text-2xl font-display font-bold text-white mb-3">Preferences Saved</h3>
              <p className="text-olive-400 mb-8 leading-relaxed">
                Alerts are included with Dashboard Pro and Dashboard Investor subscriptions.
                Subscribe below to activate weekly and priority property alerts.
              </p>
              <div className="flex flex-col gap-4">
                <a
                  href={(import.meta.env as Record<string, string>).VITE_DASHBOARD_PRO_CHECKOUT_URL || '/pricing'}
                  onClick={() => trackEvent('Sales', 'checkout clicks', 'Dashboard Pro - Alerts CTA')}
                  className="btn-primary w-full py-4 justify-center inline-flex items-center gap-2"
                >
                  Subscribe — Dashboard Pro ($79/mo) <ArrowRight size={16} />
                </a>
                <a
                  href={(import.meta.env as Record<string, string>).VITE_DASHBOARD_INVESTOR_CHECKOUT_URL || '/pricing'}
                  onClick={() => trackEvent('Sales', 'checkout clicks', 'Dashboard Investor - Alerts CTA')}
                  className="btn-secondary w-full py-4 justify-center inline-flex items-center gap-2"
                >
                  Subscribe — Dashboard Investor ($149/mo) <ArrowRight size={16} />
                </a>
                <Link
                  to="/pricing"
                  className="btn-ghost border-surface-border w-full py-3 justify-center"
                >
                  Compare all plans
                </Link>
              </div>
            </div>
          ) : (
            <div className="panel p-8 max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-surface-border">
                <Bell className="text-brand-500" size={24} />
                <h3 className="text-xl font-display font-bold text-white">Configure Your Alerts</h3>
              </div>

              {/* Tier note */}
              <div className="bg-brand-950/30 border border-brand-800/40 rounded-lg p-4 mb-8">
                <p className="text-sm text-olive-300">
                  <span className="text-brand-400 font-semibold">Alerts are included</span> with{' '}
                  Dashboard Pro ($79/mo) and Dashboard Investor ($149/mo) subscriptions.
                  Save your preferences below, then subscribe to activate them.
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="block text-xs font-semibold text-olive-400 mb-2 uppercase tracking-wider">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input w-full" 
                    placeholder="john@example.com" 
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-olive-400 mb-2 uppercase tracking-wider">Counties of Interest</label>
                    <input 
                      type="text" 
                      value={counties}
                      onChange={e => setCounties(e.target.value)}
                      className="input w-full" 
                      placeholder="e.g. Fulton, DeKalb" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-olive-400 mb-2 uppercase tracking-wider">Max Price</label>
                    <select 
                      className="select w-full"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                    >
                      <option>Any</option>
                      <option>Under $10k</option>
                      <option>Under $25k</option>
                      <option>Under $50k</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-olive-400 mb-3 uppercase tracking-wider">Acquisition Types</label>
                  <div className="grid grid-cols-2 gap-3 text-sm text-olive-300">
                    {['Land Bank', 'Municipal Surplus', 'County Surplus', 'Tax Deed / Sale', 'Sheriff Sale', 'Redevelopment Authority'].map(type => (
                      <label key={type} className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors">
                        <input 
                          type="checkbox" 
                          checked={acquisitionTypes.includes(type)}
                          onChange={() => handleAcquisitionTypeToggle(type)}
                          className="rounded bg-olive-900 border-surface-border text-brand-500 focus:ring-brand-500 w-4 h-4" 
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-olive-400 mb-2 uppercase tracking-wider">Minimum Fit Score (0–100)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={minFitScore}
                    onChange={e => setMinFitScore(e.target.value)}
                    className="input w-full" 
                  />
                </div>

                <div className="pt-6 border-t border-surface-border">
                  <button type="submit" disabled={loading} className="w-full btn-primary py-4 justify-center disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Preferences & Select Plan'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Email Preview Section */}
          <div className="mt-24 max-w-2xl mx-auto opacity-70">
            <h4 className="text-center text-sm font-semibold text-olive-500 uppercase tracking-widest mb-6">Email Digest Preview</h4>
            <div className="bg-olive-900/30 border border-olive-800 rounded-lg p-6">
              <div className="mb-4">
                <p className="text-white font-bold text-lg">Your Weekly Georgia Land Alerts</p>
                <p className="text-sm text-olive-400">We found 12 new properties matching your criteria.</p>
              </div>
              <div className="space-y-3 mb-8">
                <div className="h-16 bg-olive-800/50 rounded flex items-center px-4"><span className="text-olive-500 text-sm">Property 1 Details...</span></div>
                <div className="h-16 bg-olive-800/50 rounded flex items-center px-4"><span className="text-olive-500 text-sm">Property 2 Details...</span></div>
              </div>
              {alertSponsors.length > 0 && (
                <div className="border-t border-olive-800 pt-6">
                  <p className="text-xs text-olive-500 uppercase tracking-wider mb-4">Supported By</p>
                  <div className="space-y-4">
                    {alertSponsors.map(sponsor => (
                      <SponsorBanner key={sponsor.id} sponsor={sponsor} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
