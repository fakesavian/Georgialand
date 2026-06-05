import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, CheckCircle2, Star, Zap, Crown, ArrowRight } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import SEO from '../components/SEO';

const PLANS = [
  {
    id: 'free',
    name: 'Free Sample',
    monthlyPrice: '$0',
    annualMonthlyPrice: '$0',
    monthlyPeriod: null,
    annualPeriod: null,
    desc: 'Proof of value — no credit card required.',
    annualDesc: 'Proof of value — no credit card required.',
    features: [
      '10 hand-curated land leads',
      'Basic risk notes on each property',
      'Direct source links to county sites',
      'Due-diligence checklist included',
    ],
    cta: 'Get Sample',
    annualCta: 'Get Sample',
    ctaLink: '/free-sample',
    variant: 'ghost' as const,
    icon: <Star size={20} className="text-olive-400" />,
    popular: false,
    monthlyEnvKey: null,
    annualEnvKey: null,
  },
  {
    id: 'starter',
    name: 'Dashboard Starter',
    monthlyPrice: '$39',
    annualMonthlyPrice: '$35',
    monthlyPeriod: '/ mo',
    annualPeriod: '/ mo',
    desc: 'Full searchable database access for active researchers.',
    annualDesc: 'Full searchable database access with a lower effective monthly rate when prepaid annually.',
    features: [
      'Full database — all listings, all counties',
      'Unified search + 15+ advanced filters',
      'Risk score, fit score, data confidence',
      'Aerial map and GIS source links',
    ],
    cta: 'Get Started',
    annualCta: 'Start Annual Plan',
    ctaLink: null,
    variant: 'secondary' as const,
    icon: <Zap size={20} className="text-brand-400" />,
    popular: false,
    monthlyEnvKey: 'VITE_DASHBOARD_STARTER_CHECKOUT_URL',
    annualEnvKey: 'VITE_DASHBOARD_STARTER_ANNUAL_CHECKOUT_URL',
  },
  {
    id: 'pro',
    name: 'Dashboard Pro',
    monthlyPrice: '$79',
    annualMonthlyPrice: '$69',
    monthlyPeriod: '/ mo',
    annualPeriod: '/ mo',
    desc: 'Full workflow tools for serious investors and builders.',
    annualDesc: 'Full workflow tools with annual upfront billing and a lower monthly-equivalent rate.',
    features: [
      'Everything in Starter',
      'CSV exports and lead card exports',
      'Saved leads and personal notes',
      'Lead card builder (MD / HTML / CSV)',
      'Data quality audit panel',
    ],
    cta: 'Get Pro',
    annualCta: 'Get Pro Annual',
    ctaLink: null,
    variant: 'primary' as const,
    icon: <Crown size={20} className="text-brand-300" />,
    popular: true,
    monthlyEnvKey: 'VITE_DASHBOARD_PRO_CHECKOUT_URL',
    annualEnvKey: 'VITE_DASHBOARD_PRO_ANNUAL_CHECKOUT_URL',
  },
  {
    id: 'investor',
    name: 'Dashboard Investor',
    monthlyPrice: '$149',
    annualMonthlyPrice: '$129',
    monthlyPeriod: '/ mo',
    annualPeriod: '/ mo',
    desc: 'Agency-grade tools for high-volume deal sourcing.',
    annualDesc: 'Agency-grade tools with annual upfront billing and a lower monthly-equivalent rate.',
    features: [
      'Everything in Pro',
      'Priority and high-fit property alerts',
      'Agency contacts and deal pipeline view',
      'Investor-grade property scoring view',
      'Multi-county watchlists',
    ],
    cta: 'Get Investor',
    annualCta: 'Get Investor Annual',
    ctaLink: null,
    variant: 'secondary' as const,
    icon: <Crown size={20} className="text-amber-400" />,
    popular: false,
    monthlyEnvKey: 'VITE_DASHBOARD_INVESTOR_CHECKOUT_URL',
    annualEnvKey: 'VITE_DASHBOARD_INVESTOR_ANNUAL_CHECKOUT_URL',
  },
];

type BillingCycle = 'monthly' | 'annual';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const isAnnual = billingCycle === 'annual';

  return (
    <div className="min-h-screen bg-olive-950 text-olive-50 font-sans">
      <SEO 
        title="Pricing & Access | Georgia Land Finder"
        description="Choose the right access tier for your land investing needs. Starter, Pro, and Investor tiers available for the Georgia low-cost land database."
        canonicalUrl="https://georgialandfinder.com/pricing"
      />
      
      {/* Nav */}
      <nav className="border-b border-surface-border bg-olive-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Layers className="text-brand-500" size={24} />
            <span className="font-display font-bold text-lg text-white tracking-tight">Georgia Land Finder</span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <Link to="/pricing" className="text-white">Pricing</Link>
            <Link to="/free-sample" className="text-olive-300 hover:text-white transition-colors">Free Sample</Link>
            <Link to="/dashboard" className="btn-primary">
              Access Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-4 text-center px-6">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 tracking-tight">
          Choose your access level
        </h1>
        <p className="text-lg text-olive-400 max-w-2xl mx-auto">
          From a free test drive to full investor-grade dashboard access.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-1 rounded-full border border-surface-border bg-olive-900/80 p-1 shadow-[0_0_25px_rgba(34,197,94,0.08)]">
              {(['monthly', 'annual'] as BillingCycle[]).map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => {
                    setBillingCycle(cycle);
                    trackEvent('Sales', 'billing_toggle', cycle);
                  }}
                  aria-pressed={billingCycle === cycle}
                  className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    billingCycle === cycle
                      ? 'bg-brand-500 text-olive-950 shadow-md'
                      : 'text-olive-400 hover:text-white'
                  }`}
                >
                  {cycle === 'monthly' ? 'Monthly' : 'Annual'}
                </button>
              ))}
            </div>
            <p className="text-xs text-olive-500 text-center">
              Annual plans show the monthly-equivalent discount and are charged upfront once per year through Stripe.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
            {PLANS.map((plan) => {
              const price = isAnnual ? plan.annualMonthlyPrice : plan.monthlyPrice;
              const period = isAnnual ? plan.annualPeriod : plan.monthlyPeriod;
              const description = isAnnual ? plan.annualDesc : plan.desc;
              const checkoutEnvKey = isAnnual ? plan.annualEnvKey : plan.monthlyEnvKey;
              const checkoutUrl = checkoutEnvKey ? (import.meta.env as Record<string, string>)[checkoutEnvKey] : null;
              const ctaLabel = isAnnual ? plan.annualCta : plan.cta;

              return (
              <div
                key={plan.id}
                className={`card flex flex-col relative transition-all duration-200 ${
                  plan.popular
                    ? 'border-brand-500/60 shadow-[0_0_30px_rgba(34,197,94,0.15)] bg-olive-900/60 xl:-translate-y-4'
                    : 'hover:border-olive-600'
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                    <span className="bg-brand-500 text-olive-950 text-[11px] font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    {plan.icon}
                    <h3 className="text-lg font-display font-bold text-white">{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-display font-bold text-white">{price}</span>
                    {period && (
                      <span className="text-sm font-sans text-olive-400 font-normal">{period}</span>
                    )}
                  </div>
                  <p className="text-sm text-olive-400 leading-relaxed">{description}</p>
                </div>

                {/* Feature list */}
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-olive-300">
                      <CheckCircle2
                        size={16}
                        className={`shrink-0 mt-0.5 ${plan.popular ? 'text-brand-400' : 'text-olive-500'}`}
                      />
                      {feat}
                    </li>
                  ))}
                </ul>

                {plan.ctaLink ? (
                  <Link
                    to={plan.ctaLink}
                    onClick={() => trackEvent('Sales', 'checkout clicks', plan.name)}
                    className={`w-full text-center justify-center inline-flex items-center gap-2 ${
                      (plan.variant as string) === 'primary' ? 'btn-primary' :
                      (plan.variant as string) === 'ghost' ? 'btn-ghost border-surface-border' :
                      'btn-secondary'
                    }`}
                  >
                    {ctaLabel} <ArrowRight size={14} />
                  </Link>
                ) : (
                  checkoutUrl ? (
                    <a
                      href={checkoutUrl}
                      onClick={() => trackEvent('Sales', 'checkout clicks', `${plan.name} ${billingCycle}`)}
                      className={`w-full text-center justify-center inline-flex items-center gap-2 ${
                        plan.variant === 'primary' ? 'btn-primary' :
                        'btn-secondary bg-olive-800'
                      }`}
                    >
                      {ctaLabel} <ArrowRight size={14} />
                    </a>
                  ) : (
                    <button
                      disabled
                      className={`w-full text-center justify-center inline-flex items-center gap-2 opacity-50 cursor-not-allowed ${
                        plan.variant === 'primary' ? 'btn-primary' :
                        'btn-secondary bg-olive-800'
                      }`}
                    >
                      {isAnnual ? 'Annual Coming Soon' : 'Coming Soon'}
                    </button>
                  )
                )}
              </div>
              );
            })}
          </div>

          {/* One-time report upsell (separate from subscription tiers) */}
          <div className="mt-12 max-w-2xl mx-auto p-6 bg-olive-900/40 border border-olive-700 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-olive-500 mb-1">One-Time Purchase</p>
              <h4 className="text-base font-display font-bold text-white mb-1">Georgia Land Report — $29</h4>
              <p className="text-sm text-olive-400">
                25–50 curated leads with risk flags, source links, and due-diligence checklist. PDF + CSV download. No subscription required.
              </p>
            </div>
            {(import.meta.env as Record<string, string>).VITE_REPORT_CHECKOUT_URL ? (
              <a
                href={(import.meta.env as Record<string, string>).VITE_REPORT_CHECKOUT_URL}
                onClick={() => trackEvent('Sales', 'checkout clicks', 'Georgia Report One-time')}
                className="btn-ghost border-olive-600 text-olive-200 hover:text-white whitespace-nowrap shrink-0"
              >
                Buy Report
              </a>
            ) : (
              <button
                disabled
                className="btn-ghost border-olive-600 text-olive-500 whitespace-nowrap shrink-0 opacity-50 cursor-not-allowed"
              >
                Coming Soon
              </button>
            )}
          </div>
        </div>
      </section>

      {/* FAQ / reassurance strip */}
      <section className="py-12 border-t border-surface-border">
        <div className="max-w-4xl mx-auto px-6 grid sm:grid-cols-3 gap-8 text-center text-sm">
          <div>
            <p className="font-bold text-white mb-1">Cancel any time</p>
            <p className="text-olive-500">Monthly plans stay month-to-month; annual plans are prepaid once per year through Stripe.</p>
          </div>
          <div>
            <p className="font-bold text-white mb-1">No hidden fees</p>
            <p className="text-olive-500">The price you see is what Stripe will charge. Nothing more.</p>
          </div>
          <div>
            <p className="font-bold text-white mb-1">Data only</p>
            <p className="text-olive-500">We curate research leads. We do not broker, list, or sell real estate.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
