import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Download,
  FileText,
  Heart,
  Layers,
  MapPin,
  Search,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';
import SEO from '../components/SEO';

const docSections = [
  {
    id: 'overview',
    title: '1. What Georgia Land Finder does',
    icon: <Layers size={20} className="text-brand-400" />,
    body: [
      'Georgia Land Finder organizes low-cost Georgia land opportunities into a searchable research workspace. The site is built for investors, builders, nonprofits, and buyers who want to move faster than manually checking county sites, PDFs, land banks, surplus lists, and scattered public records.',
      'The platform does not sell land, broker deals, provide legal advice, or guarantee title. It helps users discover leads, compare opportunities, open official source links, and build a due-diligence workflow before contacting agencies or professionals.',
    ],
  },
  {
    id: 'free-tier',
    title: '2. Free Tier preview',
    icon: <CheckCircle2 size={20} className="text-brand-400" />,
    body: [
      'The Free Tier gives new users a small preview of the lead format before they subscribe. It is designed to show the kind of records, source links, risk notes, and diligence prompts included in the paid dashboard.',
      'Use the Free Tier if you want to understand the workflow, see example lead quality, and decide which paid access level fits your acquisition process. The full database, exports, saved leads, and advanced tools require a paid plan.',
    ],
  },
  {
    id: 'dashboard',
    title: '3. Dashboard database',
    icon: <BarChart3 size={20} className="text-brand-400" />,
    body: [
      'The dashboard is the main workspace. It loads the available land dataset for your access tier and presents leads in map, card, and table workflows. Paid users can review more records, compare opportunities, and move from discovery to diligence without rebuilding the same spreadsheet every week.',
      'Each record is treated as a research lead. Users should verify parcel status, ownership, taxes, zoning, utilities, buildability, title, access, and sale terms with official sources before bidding, buying, or contacting sellers.',
    ],
  },
  {
    id: 'search-filters',
    title: '4. Search and filters',
    icon: <Search size={20} className="text-brand-400" />,
    body: [
      'Search helps narrow the database by address, parcel ID, county, city, source, notes, or other visible property details. Filters help users focus on the lead types that match their strategy, such as low price, county, acreage, risk level, or acquisition category.',
      'The goal is to remove manual scanning. Instead of opening separate PDFs and county pages, users can quickly shortlist records and then open the official source links for verification.',
    ],
  },
  {
    id: 'map',
    title: '5. Map view and GIS layer controls',
    icon: <MapPin size={20} className="text-brand-400" />,
    body: [
      'The map view shows where available leads are located so users can compare geography, nearby roads, surrounding development, and county concentration. Property markers connect back to the lead cards so a user can move between map context and lead details.',
      'GIS layer controls are being scaffolded for boundaries, parcels, flood data, zoning, tax sale areas, land bank records, surplus property, off-market indicators, and opportunity zones. Current layer availability depends on plan level and backend data readiness. Future backend endpoints must enforce access server-side, not only through the user interface.',
    ],
  },
  {
    id: 'property-cards',
    title: '6. Property cards and lead details',
    icon: <FileText size={20} className="text-brand-400" />,
    body: [
      'Property cards summarize the important fields a user needs before deciding whether to investigate further: price or estimated cost category, location, parcel details, county, acreage, source, notes, and risk indicators where available.',
      'Cards are intended to speed up triage. They are not a substitute for title work, a survey, a zoning confirmation, environmental review, or official county verification.',
    ],
  },
  {
    id: 'risk',
    title: '7. Risk notes and due-diligence prompts',
    icon: <AlertCircle size={20} className="text-accent-warning" />,
    body: [
      'Risk notes call attention to common land-buying issues such as missing data, unclear access, tax sale redemption periods, zoning restrictions, flood exposure, public-owner constraints, or records that require extra verification.',
      'Risk notes are advisory. They help users ask better questions earlier, but they do not approve or reject a deal. Users remain responsible for verifying every material fact with official agencies and qualified professionals.',
    ],
  },
  {
    id: 'sources',
    title: '8. Source links and official verification',
    icon: <ShieldCheck size={20} className="text-brand-400" />,
    body: [
      'Whenever possible, records point back to the source that should be checked next: county GIS, assessor records, tax commissioner pages, land bank pages, surplus property notices, public sale notices, or marketplace/provider feeds.',
      'The source link is the bridge between discovery and verification. A good workflow is: shortlist in Georgia Land Finder, open the official source, confirm the property is still available, verify parcel facts, then contact the correct agency or professional.',
    ],
  },
  {
    id: 'exports',
    title: '9. Exports, saved leads, notes, and favorites',
    icon: <Download size={20} className="text-brand-400" />,
    body: [
      'Higher access levels are designed for repeat users who want to save leads, add notes, favorite records, and export working lists. This supports a real acquisition pipeline instead of a one-time browse session.',
      'Exports are meant for personal research workflows, investor review, or team diligence. Users should not resell raw data or represent Georgia Land Finder research as official government records.',
    ],
  },
  {
    id: 'alerts',
    title: '10. Alerts and recurring updates',
    icon: <Bell size={20} className="text-brand-400" />,
    body: [
      'Alerts are intended to help users monitor new or changed opportunities without checking every source manually. As more backend data sources are connected, alert workflows can notify users when matching counties, price ranges, or lead types change.',
      'Data update cadence can vary by source. County pages, land banks, tax sale notices, commercial providers, and GIS services all publish on different schedules, so users should treat alerts as helpful prompts rather than guarantees.',
    ],
  },
  {
    id: 'plans-billing',
    title: '11. Plans, signup, login, and billing',
    icon: <UserCircle size={20} className="text-brand-400" />,
    body: [
      'Signup creates access to the user workspace. Login returns users to their dashboard and account tools. Paid checkout is handled through Stripe so subscription billing is separated from property research data.',
      'Plan levels control which product capabilities are visible and available. Free Tier users see a preview. Starter users get core dashboard access. Pro and Investor users get progressively more workflow, export, GIS, alert, and investor-focused tooling as those features are enabled.',
    ],
  },
  {
    id: 'reports',
    title: '12. One-time reports',
    icon: <FileText size={20} className="text-brand-400" />,
    body: [
      'The one-time report option is for users who want a curated deliverable without starting a subscription. It is useful when someone wants a smaller batch of leads, a PDF/CSV-style research packet, or a quick market scan.',
      'Reports and dashboard access serve different needs: reports are fixed deliverables, while subscriptions are for ongoing search, filtering, monitoring, and workflow access.',
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-olive-950 text-olive-50 font-sans">
      <SEO
        title="Docs: How Georgia Land Finder Works"
        description="Detailed product documentation for Georgia Land Finder: Free Tier, dashboard, search, filters, map, GIS layers, source links, risk notes, exports, alerts, billing, and reports."
        canonicalUrl="https://georgialandfinder.com/docs"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: 'How Georgia Land Finder Works',
          about: 'Georgia land search documentation',
        }}
      />

      <nav className="border-b border-surface-border bg-olive-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Layers className="text-brand-500" size={24} />
            <span className="font-display font-bold text-lg text-white tracking-tight">Georgia Land Finder</span>
          </Link>
          <div className="flex items-center gap-5 text-sm font-semibold">
            <Link to="/pricing" className="text-olive-300 hover:text-white transition-colors">Pricing</Link>
            <Link to="/docs" className="text-white">Docs</Link>
            <Link to="/faq" className="text-olive-300 hover:text-white transition-colors">FAQ</Link>
            <Link to="/free-tier" className="text-olive-300 hover:text-white transition-colors">Free Tier</Link>
            <Link to="/free-tier" className="btn-primary">Start Free</Link>
          </div>
        </div>
      </nav>

      <header className="border-b border-surface-border bg-olive-900/30">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-400 mb-4">Product Documentation</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-5 tracking-tight">
            How Georgia Land Finder works
          </h1>
          <p className="text-lg text-olive-300 max-w-3xl leading-relaxed">
            A detailed guide to every major site function: how users discover Georgia land leads, evaluate risk,
            use map and GIS tools, verify sources, save/export work, and choose the right access level.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/free-tier" className="btn-primary inline-flex items-center gap-2">
              Start with Free Tier <ArrowRight size={16} />
            </Link>
            <Link to="/faq" className="btn-ghost border-surface-border inline-flex items-center gap-2">
              Read FAQ
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-[260px_1fr] gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-24 panel p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-olive-500 mb-4">On this page</p>
            <div className="space-y-2">
              {docSections.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="block text-sm text-olive-300 hover:text-white transition-colors">
                  {section.title}
                </a>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          {docSections.map((section) => (
            <section key={section.id} id={section.id} className="panel p-6 md:p-8 scroll-mt-24">
              <div className="flex items-start gap-3 mb-4">
                <div className="mt-1 rounded-lg bg-olive-900 border border-surface-border p-2">{section.icon}</div>
                <h2 className="text-2xl font-display font-bold text-white">{section.title}</h2>
              </div>
              <div className="space-y-4 text-olive-300 leading-relaxed">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-2xl border border-brand-500/40 bg-brand-500/10 p-8 text-center">
            <h2 className="text-2xl font-display font-bold text-white mb-3">Ready to see the workflow with real leads?</h2>
            <p className="text-olive-300 max-w-2xl mx-auto mb-6">
              Start with the Free Tier preview, then upgrade when you need the full dashboard, exports, saved leads, and investor-grade tooling.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/free-tier" className="btn-primary inline-flex items-center gap-2">
                Start Free Tier <ArrowRight size={16} />
              </Link>
              <Link to="/pricing" className="btn-secondary bg-olive-800 inline-flex items-center gap-2">
                Compare Plans
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
