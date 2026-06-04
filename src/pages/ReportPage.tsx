import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import SponsorBanner from '../components/marketing/SponsorBanner';
import SEO from '../components/SEO';
import { sponsors } from '../data/sponsors';

export default function ReportPage() {
  const reportSponsors = sponsors.filter(s => s.active && s.placements.includes('report'));
  return (
    <div className="min-h-screen bg-olive-950 text-olive-50 font-sans">
      <SEO 
        title="Georgia Land Deals Report | Top 100 Opportunities"
        description="Get the fully enriched report of the top 100 lowest-cost land deals in Georgia. Sourced from tax sales, land banks, and surplus lists."
        canonicalUrl="https://georgialandfinder.com/report"
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

      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 tracking-tight">Georgia Low-Cost Land Report</h1>
            <p className="text-lg text-olive-300 mb-8 leading-relaxed">
              Instantly download our curated list of 25-50 high-potential land opportunities in Georgia. Organized for buyers, builders, and investors.
            </p>
            <ul className="space-y-4 text-sm text-olive-300">
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-brand-500 shrink-0" size={20} /> 25-50 curated leads (Land bank, surplus, tax-sale)</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-brand-500 shrink-0" size={20} /> Direct links to official sources and GIS</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-brand-500 shrink-0" size={20} /> Risk flags & data missing warnings</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-brand-500 shrink-0" size={20} /> Agency contact list included</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-brand-500 shrink-0" size={20} /> Formats: CSV spreadsheet + PDF/Markdown</li>
            </ul>
          </div>
          
          <div className="panel p-8 border-brand-500/50 shadow-glow-brand flex flex-col items-center text-center">
            <FileText className="text-brand-500 mb-6" size={48} />
            <h3 className="text-2xl font-display font-bold text-white mb-2">Buy the Report</h3>
            <p className="text-5xl font-display font-bold text-white mb-2">$29</p>
            <p className="text-sm text-olive-400 mb-8">One-time purchase. Instant download.</p>
            
            {import.meta.env.VITE_REPORT_CHECKOUT_URL ? (
              <a href={import.meta.env.VITE_REPORT_CHECKOUT_URL} className="w-full btn-primary py-4 text-lg justify-center">
                Checkout
              </a>
            ) : (
              <button disabled className="w-full btn-primary py-4 text-lg justify-center opacity-50 cursor-not-allowed">
                Coming Soon
              </button>
            )}
            
            <p className="text-xs text-olive-500 mt-6 max-w-xs leading-relaxed">
              By purchasing, you agree to our Terms of Use. We provide research data, not real-estate or legal advice.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
