import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layers, ArrowRight, ShieldCheck } from 'lucide-react';
import { seoPages } from '../data/seoPages';
import GeorgiaLandSearchHero from '../components/marketing/GeorgiaLandSearchHero';
import NotFoundPage from './NotFoundPage';
import SEO from '../components/SEO';

export default function SeoLandingPage() {
  const { slug } = useParams();
  
  if (!slug || !seoPages[slug]) {
    return <NotFoundPage />;
  }

  const pageData = seoPages[slug];

  return (
    <div className="min-h-screen bg-olive-950 text-olive-50 font-sans">
      <SEO 
        title={pageData.title || pageData.h1}
        description={pageData.description}
        canonicalUrl={`https://georgialandfinder.com/${slug}`}
        type="article"
      />
      {/* Navbar */}
      <nav className="border-b border-surface-border bg-olive-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Layers className="text-brand-500" size={24} />
            <span className="font-display font-bold text-lg text-white tracking-tight">Georgia Land Finder</span>
          </Link>
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
      <section className="pt-24 pb-16 bg-gradient-to-b from-olive-900/40 to-olive-950 border-b border-surface-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            {pageData.h1}
          </h1>
          <p className="text-xl text-olive-300 leading-relaxed mb-8">
            {pageData.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/free-sample" className="btn-primary">
              Get Free 10-Lead Sample <ArrowRight size={18} />
            </Link>
            <Link to="/pricing" className="btn-secondary">
              View Premium Access
            </Link>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 max-w-3xl mx-auto px-6">
        <article className="prose prose-invert prose-olive max-w-none">
          {pageData.content.map((paragraph, index) => (
            <p key={index} className="text-lg text-olive-300 leading-relaxed mb-6">
              {paragraph}
            </p>
          ))}
          
          <div className="bg-olive-900/50 border border-brand-500/30 rounded-xl p-8 mt-12 text-center">
            <h3 className="text-2xl font-display font-bold text-white mb-4">Stop wasting hours digging through county websites.</h3>
            <p className="text-olive-300 mb-6">
              Get curated Georgia low-cost land leads with source links, risk flags, alerts, and next-step instructions.
            </p>
            <Link to="/pricing" className="btn-primary w-full justify-center">
              Get Started Now
            </Link>
          </div>
        </article>
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
