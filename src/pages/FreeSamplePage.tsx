import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Layers, Loader2, Mail, Map, ShieldCheck, Sparkles } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import SEO from '../components/SEO';
import { useTheme } from '../lib/ThemeContext';

type FunnelTheme = 'day' | 'night';

const buyerTypes = [
  'Just researching',
  'First-time buyer',
  'Investor',
  'Builder',
  'Nonprofit',
  'Developer'
];

const freeTierBenefits = [
  'Open the dashboard map immediately',
  'Preview hand-curated Georgia land opportunities',
  'See source links, risk notes, and next-step checklists'
];

const themeClasses: Record<FunnelTheme, {
  page: string;
  nav: string;
  logo: string;
  logoText: string;
  navLink: string;
  heroGradient: string;
  eyebrow: string;
  heading: string;
  body: string;
  featureCard: string;
  featureTitle: string;
  featureBody: string;
  icon: string;
  formCard: string;
  label: string;
  input: string;
  helper: string;
  button: string;
}> = {
  day: {
    page: 'bg-[#f6f8f3] text-olive-950',
    nav: 'border-olive-200 bg-white/90',
    logo: 'text-brand-600',
    logoText: 'text-olive-950',
    navLink: 'text-olive-700 hover:text-olive-950',
    heroGradient: 'from-brand-100/70 to-transparent',
    eyebrow: 'border-brand-200 bg-white text-brand-800 shadow-sm',
    heading: 'text-olive-950',
    body: 'text-olive-700',
    featureCard: 'bg-white border-olive-200 shadow-sm',
    featureTitle: 'text-olive-950',
    featureBody: 'text-olive-600',
    icon: 'text-brand-600',
    formCard: 'border-olive-200 bg-white shadow-2xl shadow-olive-900/10',
    label: 'text-olive-600',
    input: 'border-olive-200 bg-olive-50 text-olive-950 placeholder:text-olive-400 focus:border-brand-500 focus:ring-brand-100',
    helper: 'text-olive-500',
    button: 'bg-brand-600 text-white shadow-lg shadow-brand-900/15 hover:bg-brand-500'
  },
  night: {
    page: 'bg-olive-950 text-olive-50',
    nav: 'border-surface-border bg-olive-900/70',
    logo: 'text-brand-500',
    logoText: 'text-white',
    navLink: 'text-olive-300 hover:text-white',
    heroGradient: 'from-olive-900/80 to-transparent',
    eyebrow: 'border-brand-500/30 bg-olive-900/80 text-brand-300 shadow-lg shadow-black/10',
    heading: 'text-white',
    body: 'text-olive-300',
    featureCard: 'bg-olive-900/70 border-surface-border shadow-xl shadow-black/10',
    featureTitle: 'text-white',
    featureBody: 'text-olive-400',
    icon: 'text-brand-500',
    formCard: 'border-surface-border bg-olive-900/85 shadow-2xl shadow-black/25',
    label: 'text-olive-400',
    input: 'border-olive-800 bg-olive-950 text-white placeholder:text-olive-600 focus:border-brand-500 focus:ring-brand-900/40',
    helper: 'text-olive-500',
    button: 'bg-brand-600 text-white shadow-lg shadow-black/20 hover:bg-brand-500'
  }
} as const;

export default function FreeSamplePage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    buyerType: 'Just researching'
  });

  const t = themeClasses[theme];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    trackEvent('Marketing', 'free_tier_signup_started', 'Free Tier Funnel');

    const leadPayload = {
      first_name: formData.firstName.trim(),
      email: formData.email.trim(),
      buyer_type: formData.buyerType,
      source: 'free_tier_light_funnel'
    };

    try {
      localStorage.setItem('glf_free_tier_lead', JSON.stringify({ ...leadPayload, captured_at: new Date().toISOString() }));

      const response = await fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadPayload)
      });

      if (!response.ok) {
        console.warn('Free tier lead capture API returned an error; continuing to dashboard.', response.status);
      }
    } catch (err) {
      console.warn('Free tier lead capture failed; continuing to dashboard.', err);
    } finally {
      trackEvent('Marketing', 'free_tier_signup_completed', 'Free Tier Funnel');
      setLoading(false);
      navigate('/dashboard?source=free-tier', { replace: false });
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${t.page}`} data-theme={theme}>
      <SEO
        title="Start Free | Georgia Land Finder"
        description="Create a free Georgia Land Finder preview account and open the dashboard map with hand-curated low-cost land opportunities."
        canonicalUrl="https://georgialandfinder.com/free-tier"
      />

      <nav className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300 ${t.nav}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Layers className={t.logo} size={24} />
            <span className={`font-display font-bold text-lg tracking-tight ${t.logoText}`}>Georgia Land Finder</span>
          </Link>
          <div className="flex items-center gap-4 pr-36 text-sm font-semibold">
            <Link to="/pricing" className={`transition-colors ${t.navLink}`}>Pricing</Link>
            <Link to="/docs" className={`transition-colors ${t.navLink}`}>Docs</Link>
            <Link to="/faq" className={`transition-colors ${t.navLink}`}>FAQ</Link>
            <Link to="/free-tier" className={`rounded-xl px-5 py-2.5 shadow-sm transition-colors ${t.button}`}>Start Free</Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden py-16 md:py-24">
        <div className={`absolute inset-x-0 top-0 h-72 bg-gradient-to-b ${t.heroGradient}`} />
        <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold mb-6 ${t.eyebrow}`}>
              <Sparkles size={16} /> Free dashboard preview
            </div>
            <h1 className={`text-4xl md:text-6xl font-display font-bold tracking-tight mb-6 ${t.heading}`}>
              Create your free account, then open the land dashboard.
            </h1>
            <p className={`text-lg md:text-xl leading-relaxed max-w-2xl mb-8 ${t.body}`}>
              A quick signup gate before the dashboard. No credit card. Use the free tier to preview the map, compare sample parcels, and see how the workflow works before upgrading.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className={`rounded-2xl border p-4 ${t.featureCard}`}>
                <Map className={`${t.icon} mb-3`} size={22} />
                <p className={`text-sm font-bold ${t.featureTitle}`}>Map-first preview</p>
                <p className={`text-xs mt-1 ${t.featureBody}`}>Land opportunities open visually.</p>
              </div>
              <div className={`rounded-2xl border p-4 ${t.featureCard}`}>
                <ShieldCheck className={`${t.icon} mb-3`} size={22} />
                <p className={`text-sm font-bold ${t.featureTitle}`}>Risk notes</p>
                <p className={`text-xs mt-1 ${t.featureBody}`}>Know what to verify next.</p>
              </div>
              <div className={`rounded-2xl border p-4 ${t.featureCard}`}>
                <CheckCircle2 className={`${t.icon} mb-3`} size={22} />
                <p className={`text-sm font-bold ${t.featureTitle}`}>Upgrade path</p>
                <p className={`text-xs mt-1 ${t.featureBody}`}>Tier up when ready.</p>
              </div>
            </div>

            <ul className={`space-y-3 text-sm ${t.body}`}>
              {freeTierBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3 items-center">
                  <CheckCircle2 className={`${t.icon} shrink-0`} size={19} />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className={`rounded-3xl border p-6 md:p-8 ${t.formCard}`}>
            <div className="mb-6">
              <p className={`text-sm font-bold uppercase tracking-[0.22em] ${t.icon}`}>Start Free</p>
              <h2 className={`text-3xl font-display font-bold mt-2 ${t.heading}`}>Unlock the preview dashboard</h2>
              <p className={`text-sm mt-2 ${t.body}`}>Tell us who you are, then we’ll take you straight to the dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${t.label}`}>First name</label>
                <input
                  required
                  type="text"
                  className={`w-full rounded-xl border px-4 py-3 outline-none focus:ring-4 ${t.input}`}
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${t.label}`}>Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-olive-500" size={18} />
                  <input
                    required
                    type="email"
                    className={`w-full rounded-xl border py-3 pl-10 pr-4 outline-none focus:ring-4 ${t.input}`}
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${t.label}`}>Buyer type</label>
                <select
                  className={`w-full rounded-xl border px-4 py-3 outline-none focus:ring-4 ${t.input}`}
                  value={formData.buyerType}
                  onChange={(e) => setFormData({ ...formData, buyerType: e.target.value })}
                >
                  {buyerTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 font-bold transition-colors disabled:opacity-70 ${t.button}`}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Start Free & Open Dashboard <ArrowRight size={18} /></>}
              </button>

              <p className={`text-center text-xs ${t.helper}`}>
                Free tier preview. No credit card required. Upgrade anytime from the dashboard.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
