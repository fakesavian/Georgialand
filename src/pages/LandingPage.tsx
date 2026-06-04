import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, BarChart3, ShieldCheck, CheckCircle2, Layers, AlertCircle, ArrowRight } from 'lucide-react';
import GeorgiaLandSearchHero from '../components/marketing/GeorgiaLandSearchHero';
import { trackEvent } from '../lib/analytics';
import SEO from '../components/SEO';
import SponsorBanner from '../components/marketing/SponsorBanner';
import { sponsors } from '../data/sponsors';

export default function LandingPage() {
  const footerSponsors = sponsors.filter(s => s.active && s.placements.includes('footer'));
  return (
    <div className="min-h-screen bg-olive-950 text-olive-50 font-sans selection:bg-brand-500/30">
      <SEO 
        title="Find Cheap Land in Georgia | Off-Market & Tax Deals"
        description="Access curated lists of low-cost land opportunities in Georgia. Find land bank lots, tax deed properties, and wholesale deals under $50k."
        canonicalUrl="https://georgialandfinder.com/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Georgia Low-Cost Land Finder",
          "url": "https://georgialandfinder.com/",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://georgialandfinder.com/dashboard?search={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }}
      />
      {/* Navbar */}
      <nav className="border-b border-surface-border bg-olive-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="text-brand-500" size={24} />
            <span className="font-display font-bold text-lg text-white tracking-tight">Georgia Land Finder</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <Link to="/pricing" className="text-olive-300 hover:text-white transition-colors">Pricing</Link>
            <Link to="/free-sample" className="text-olive-300 hover:text-white transition-colors">Free Sample</Link>
            <Link to="/dashboard" className="btn-primary">
              Access Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <GeorgiaLandSearchHero />

      {/* Trust & Stats Section */}
      <section className="py-12 border-y border-surface-border bg-olive-900/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="text-center">
            <p className="text-3xl font-display font-bold text-white mb-1">150+</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-olive-400">Curated Lots</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-display font-bold text-white mb-1">12</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-olive-400">Counties Tracked</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-display font-bold text-white mb-1">Weekly</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-olive-400">Data Updates</p>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">A professional workspace for land diligence.</h2>
            <p className="text-olive-400 max-w-2xl mx-auto text-lg">We structure chaotic municipal data into actionable intelligence for investors, builders, and nonprofits.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="panel p-8">
              <Search className="text-brand-500 mb-6" size={32} />
              <h3 className="text-xl font-display font-bold text-white mb-3">Unified Search</h3>
              <p className="text-olive-300 leading-relaxed">Filter across multiple acquisition types instantly. Find properties by exact parcel ID, price category, or zoning code without jumping between PDFs.</p>
            </div>
            <div className="panel p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <AlertCircle size={100} />
              </div>
              <AlertCircle className="text-accent-warning mb-6" size={32} />
              <h3 className="text-xl font-display font-bold text-white mb-3">Risk Assessment</h3>
              <p className="text-olive-300 leading-relaxed">Every property includes a risk score, highlighting missing data, restrictive covenants, or complex title issues commonly found in tax sales.</p>
            </div>
            <div className="panel p-8">
              <MapPin className="text-brand-500 mb-6" size={32} />
              <h3 className="text-xl font-display font-bold text-white mb-3">Aerial & Map Views</h3>
              <p className="text-olive-300 leading-relaxed">Built-in geographic visualization with direct links out to county GIS tools, letting you assess lot shape, access, and topography immediately.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Suite Matrix */}
      <section className="py-24 bg-olive-900 border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-white mb-4">Choose your access level</h2>
            <p className="text-olive-400 text-lg">From a free test drive to full investor-grade dashboard access.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="card flex flex-col">
              <h3 className="text-lg font-display font-bold text-white mb-2">Free Sample</h3>
              <p className="text-3xl font-display font-bold text-white mb-4">$0</p>
              <p className="text-sm text-olive-400 mb-6 flex-grow">10-lead sample for email capture.</p>
              <Link to="/free-sample" onClick={() => trackEvent('Marketing', 'pricing views', 'Free Sample')} className="w-full btn-ghost border-surface-border mt-auto">Get Sample</Link>
            </div>

            <div className="card flex flex-col bg-olive-800/30 border-olive-700">
              <h3 className="text-lg font-display font-bold text-white mb-2">Dashboard Starter</h3>
              <p className="text-3xl font-display font-bold text-white mb-4">$39 <span className="text-sm font-sans text-olive-500 font-normal">/ mo</span></p>
              <p className="text-sm text-olive-400 mb-6 flex-grow">Full searchable database access.</p>
              <Link to="/pricing" onClick={() => trackEvent('Marketing', 'pricing views', 'Dashboard Starter')} className="w-full btn-secondary border-surface-border bg-olive-800 mt-auto">View Plans</Link>
            </div>

            <div className="card flex flex-col bg-olive-800/30 border-brand-500/50 shadow-glow-brand relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-olive-950 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Popular</div>
              <h3 className="text-lg font-display font-bold text-white mb-2">Dashboard Pro</h3>
              <p className="text-3xl font-display font-bold text-white mb-4">$79 <span className="text-sm font-sans text-olive-500 font-normal">/ mo</span></p>
              <p className="text-sm text-olive-400 mb-6 flex-grow">Exports, saved leads, notes, and lead cards.</p>
              <Link to="/pricing" onClick={() => trackEvent('Marketing', 'pricing views', 'Dashboard Pro')} className="w-full btn-primary mt-auto">View Plans</Link>
            </div>

            <div className="card flex flex-col bg-olive-800/30 border-olive-700">
              <h3 className="text-lg font-display font-bold text-white mb-2">Dashboard Investor</h3>
              <p className="text-3xl font-display font-bold text-white mb-4">$149 <span className="text-sm font-sans text-olive-500 font-normal">/ mo</span></p>
              <p className="text-sm text-olive-400 mb-6 flex-grow">Priority alerts, agency view, deal pipeline.</p>
              <Link to="/pricing" onClick={() => trackEvent('Marketing', 'pricing views', 'Dashboard Investor')} className="w-full btn-secondary border-surface-border bg-olive-800 mt-auto">View Plans</Link>
            </div>

          </div>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="py-16 bg-olive-950 border-t border-surface-border text-center">
        <div className="max-w-3xl mx-auto px-6">
          <ShieldCheck className="mx-auto text-olive-600 mb-4" size={32} />
          <p className="text-sm text-olive-400 leading-relaxed">
            <strong className="text-olive-300">Important Disclaimer:</strong> Georgia Low-Cost Land Finder provides research and data organization only. We are not a real-estate brokerage, law firm, title company, or financial advisor. Users should verify all property details with official agencies, title professionals, surveyors, and local authorities before purchasing or bidding.
          </p>
        </div>
      </section>

      {/* Sponsors Section */}
      {footerSponsors.length > 0 && (
        <section className="py-16 bg-olive-900/30 border-t border-surface-border">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-center text-sm font-semibold text-olive-400 mb-8 uppercase tracking-wider">Trusted Resources & Partners</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {footerSponsors.map(sponsor => (
                <SponsorBanner key={sponsor.id} sponsor={sponsor} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-surface-border bg-olive-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Layers className="text-olive-600" size={20} />
            <span className="font-display font-bold text-olive-500 text-sm">Georgia Land Finder</span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-olive-500">
            <Link to="/disclaimer" className="hover:text-olive-300 transition-colors">Disclaimer</Link>
            <Link to="/terms" className="hover:text-olive-300 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-olive-300 transition-colors">Privacy</Link>
          </div>
          <div className="text-xs text-olive-600 font-medium">
            &copy; {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
