import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, HelpCircle, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import SEO from '../components/SEO';
import MarketingNav from '../components/marketing/MarketingNav';

const faqs = [
  {
    question: 'What is Georgia Land Finder?',
    answer:
      'Georgia Land Finder is a research dashboard for finding low-cost Georgia land opportunities. It organizes leads from public records, land banks, tax sale notices, county resources, and curated research workflows so you can shortlist properties faster.',
  },
  {
    question: 'Is this a real estate brokerage or listing site?',
    answer:
      'No. Georgia Land Finder is not a brokerage, agent, law firm, title company, or financial advisor. We provide organized research leads and source links. You verify every property with official agencies and professionals before buying or bidding.',
  },
  {
    question: 'Why not just search county websites myself?',
    answer:
      'You can, but county data is scattered across assessor sites, GIS portals, PDFs, auction notices, land bank pages, and surplus lists. Georgia Land Finder saves time by organizing those leads into one workflow with filters, maps, notes, risk prompts, and source links.',
  },
  {
    question: 'What do I get in the Free Tier?',
    answer:
      'The Free Tier gives you a preview of the lead format: example property opportunities, basic risk notes, source links, and the diligence workflow. It is the best first step if you want to see the product before choosing a paid dashboard plan.',
  },
  {
    question: 'Who is this for?',
    answer:
      'It is built for land investors, builders, wholesalers, nonprofits, infill developers, and buyers who want to monitor Georgia land opportunities without manually rebuilding spreadsheets from public sources every week.',
  },
  {
    question: 'What types of land opportunities do you track?',
    answer:
      'The product focuses on low-cost Georgia land leads such as land bank lots, surplus property, tax sale research leads, vacant parcels, public-owner opportunities, off-market candidates, and other acquisition targets that may require further diligence.',
  },
  {
    question: 'Are properties guaranteed to be available?',
    answer:
      'No. Property data changes quickly. A parcel may be sold, redeemed, withdrawn, repriced, or incorrectly listed by a source. We help you find and organize leads, but you must verify availability and terms with the official source before taking action.',
  },
  {
    question: 'How often is the data updated?',
    answer:
      'Update cadence depends on the source. Some public sources change weekly, some monthly, and some only when counties or agencies publish new material. Paid dashboard access is designed for ongoing monitoring as source coverage expands.',
  },
  {
    question: 'What is the difference between Starter, Pro, and Investor?',
    answer:
      'Starter unlocks the full database with county boundaries and basic filters. Pro adds exports, saved notes, advanced filters, parcel boundaries (where available), and alert preferences. Investor is for high-volume sourcing with additional value scoring, deal pipeline, and agency contact workflows. Some advanced layers like FEMA, opportunity zones, and parcel-level off-market scoring are still being built.',
  },
  {
    question: 'Can I export leads?',
    answer:
      'Exports are intended for higher access tiers. They help serious users move shortlisted records into spreadsheets, investor reviews, diligence trackers, or team workflows. Free Tier users should upgrade when they need full database and export access.',
  },
  {
    question: 'Do you include parcel, zoning, flood, or GIS data?',
    answer:
      'Our GIS layer system includes county/city boundaries, parcel boundaries (where verified-source records exist), and zoning overlays (where county data is available). FEMA flood zones, opportunity zones, and off-market scoring are being built out. Parcel-level data quality and availability depend on county GIS sources and plan level.',
  },
  {
    question: 'Do you provide MLS or IDX listings?',
    answer:
      'MLS, IDX, and RESO data require proper authorization from providers. Georgia Land Finder is structured to support compliant listing integrations, but unauthorized MLS data is not treated as public data.',
  },
  {
    question: 'Can beginners use this?',
    answer:
      'Yes. The workflow is designed to help beginners understand what to verify next: parcel facts, ownership, access, zoning, taxes, title issues, flood exposure, and sale terms. The FAQ, Docs page, and source links help you learn the process while using real leads.',
  },
  {
    question: 'What should I do before buying a property?',
    answer:
      'Verify the parcel with the county, confirm taxes and liens, check zoning and utilities, inspect access, review flood/environmental risk, understand tax sale redemption rules where applicable, and use qualified title, legal, survey, and real-estate professionals when needed.',
  },
  {
    question: 'What is the fastest way to start?',
    answer:
      'Start with the Free Tier. If the lead format matches your workflow, upgrade to the dashboard plan that fits how often you search and whether you need exports, saved leads, alerts, and investor tools.',
  },
];

export default function FAQPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-olive-950 text-olive-50 font-sans">
      <SEO
        title="FAQ | Georgia Land Finder"
        description="Frequently asked questions about Georgia Land Finder, low-cost land leads, dashboard plans, Free Tier access, GIS data, source verification, and due diligence."
        canonicalUrl="https://georgialandfinder.com/faq"
        jsonLd={faqJsonLd}
      />

      <MarketingNav />

      <header className="border-b border-surface-border bg-gradient-to-b from-olive-900/70 to-olive-950">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-brand-300 mb-6">
            <Sparkles size={14} /> New to land research?
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-5 tracking-tight">
            Frequently asked questions
          </h1>
          <p className="text-lg text-olive-300 max-w-3xl mx-auto leading-relaxed">
            Clear answers for buyers, investors, builders, and nonprofits comparing Georgia Land Finder to public records,
            county GIS sites, land marketplaces, and manual spreadsheet research.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/free-tier" className="btn-primary inline-flex items-center gap-2">
              Start Free Tier <ArrowRight size={16} />
            </Link>
            <Link to="/pricing" className="btn-ghost border-surface-border inline-flex items-center gap-2">
              Compare Plans
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <section className="grid md:grid-cols-3 gap-5 mb-12">
          <div className="panel p-6">
            <CheckCircle2 className="text-brand-400 mb-4" size={28} />
            <h2 className="text-lg font-display font-bold text-white mb-2">Preview before paying</h2>
            <p className="text-sm text-olive-400 leading-relaxed">Use the Free Tier to see the lead structure and diligence workflow before choosing a subscription.</p>
          </div>
          <div className="panel p-6">
            <ShieldCheck className="text-brand-400 mb-4" size={28} />
            <h2 className="text-lg font-display font-bold text-white mb-2">Source-first research</h2>
            <p className="text-sm text-olive-400 leading-relaxed">Records point users back to official sources for verification instead of pretending research leads are guaranteed deals.</p>
          </div>
          <div className="panel p-6">
            <HelpCircle className="text-brand-400 mb-4" size={28} />
            <h2 className="text-lg font-display font-bold text-white mb-2">Built for decisions</h2>
            <p className="text-sm text-olive-400 leading-relaxed">Filters, map context, risk notes, and exports help users decide what is worth investigating next.</p>
          </div>
        </section>

        <section className="space-y-4">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-2xl border border-surface-border bg-olive-900/40 p-5 open:border-brand-500/40 open:bg-olive-900/70">
              <summary className="cursor-pointer list-none font-display text-lg font-bold text-white flex items-start justify-between gap-4">
                <span>{faq.question}</span>
                <span className="mt-1 text-brand-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 text-olive-300 leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-brand-500/40 bg-brand-500/10 p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">Still deciding? Start with the free preview.</h2>
          <p className="text-olive-300 max-w-2xl mx-auto mb-6">
            The Free Tier lets you see how Georgia Land Finder organizes leads before you commit to a paid dashboard plan.
          </p>
          <Link to="/free-tier" className="btn-primary inline-flex items-center gap-2">
            Start Free Tier <ArrowRight size={16} />
          </Link>
        </section>
      </main>
    </div>
  );
}
