import React from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import ThemeToggle from '../ThemeToggle';

/**
 * Shared, auth-aware marketing/site header used across every public page.
 *
 * Logged out: Pricing · Docs · FAQ · Log in · Start Free
 * Logged in:  Pricing · Docs · FAQ · Dashboard   (Start Free hidden)
 *
 * The day/night toggle lives INSIDE the header on both desktop and mobile.
 * While the Supabase session is resolving we render a fixed-width skeleton so
 * the primary CTA never flashes from one state to the other.
 */
export default function MarketingNav() {
  const { user, isLoading } = useAuth();

  return (
    <nav className="marketing-nav border-b border-surface-border bg-olive-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="marketing-nav__inner max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="marketing-nav__brand flex items-center gap-2 min-w-0">
          <Layers className="text-brand-500 shrink-0" size={24} />
          <span className="marketing-nav__brand-text font-display font-bold text-lg text-white tracking-tight whitespace-nowrap">
            <span className="sm:hidden">GA Land Finder</span>
            <span className="hidden sm:inline">Georgia Land Finder</span>
          </span>
        </Link>

        <div className="marketing-nav__actions flex items-center gap-2 sm:gap-4">
          <div className="marketing-nav__links flex items-center gap-3 sm:gap-5 text-sm font-semibold">
            <Link to="/pricing" className="text-olive-300 hover:text-white transition-colors">Pricing</Link>
            <Link to="/docs" className="hidden md:inline text-olive-300 hover:text-white transition-colors">Docs</Link>
            <Link to="/faq" className="hidden md:inline text-olive-300 hover:text-white transition-colors">FAQ</Link>
          </div>

          <div className="marketing-nav__cta flex items-center gap-2 sm:gap-3 text-sm font-semibold">
            {isLoading ? (
              <span
                className="marketing-nav__cta-skeleton inline-block h-9 w-[5.5rem] rounded-lg bg-olive-800/60 animate-pulse"
                aria-hidden="true"
              />
            ) : user ? (
              <Link to="/dashboard" className="btn-primary">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-olive-300 hover:text-white transition-colors">Log in</Link>
                <Link to="/signup" className="btn-primary">Start Free</Link>
              </>
            )}
          </div>

          <ThemeToggle className="marketing-nav__toggle" />
        </div>
      </div>
    </nav>
  );
}
