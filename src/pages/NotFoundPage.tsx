import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Home, ArrowLeft, Layers } from 'lucide-react';
import SEO from '../components/SEO';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-olive-950 text-olive-50 font-sans flex flex-col">
      <SEO 
        title="Page Not Found"
        description="The page you are looking for does not exist."
        noindex={true}
      />
      {/* Minimal nav */}
      <nav className="border-b border-surface-border bg-olive-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <Layers className="text-brand-500 group-hover:text-brand-400 transition-colors" size={22} />
            <span className="font-display font-bold text-lg text-white tracking-tight group-hover:text-brand-200 transition-colors">
              Georgia Land Finder
            </span>
          </Link>
        </div>
      </nav>

      {/* 404 body */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        {/* Icon */}
        <div className="w-20 h-20 bg-brand-950/40 border border-brand-800/50 rounded-2xl flex items-center justify-center mb-8">
          <MapPin size={36} className="text-brand-500" />
        </div>

        {/* Headline */}
        <p className="text-brand-500 text-xs font-bold uppercase tracking-widest mb-3 font-mono">
          404 — Page Not Found
        </p>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 tracking-tight">
          This lot doesn't exist.
        </h1>
        <p className="text-olive-400 max-w-md mx-auto text-lg leading-relaxed mb-10">
          The page you're looking for may have been moved, deleted, or never existed.
          Head back to find real Georgia land opportunities.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost border-surface-border flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
          <Link to="/" className="btn-secondary flex items-center gap-2">
            <Home size={16} />
            Home
          </Link>
          <Link to="/dashboard" className="btn-primary flex items-center gap-2">
            <MapPin size={16} />
            Browse Listings
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-surface-border text-center text-xs text-olive-600">
        &copy; {new Date().getFullYear()} Georgia Land Finder &mdash; Research use only.
      </footer>
    </div>
  );
}
