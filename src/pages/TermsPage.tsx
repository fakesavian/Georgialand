import React from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-olive-950 text-olive-50 font-sans">
      <nav className="border-b border-surface-border bg-olive-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Layers className="text-brand-500" size={24} />
            <span className="font-display font-bold text-lg text-white tracking-tight">Georgia Land Finder</span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <Link to="/dashboard" className="btn-primary">
              Access Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <section className="py-24 max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-display font-bold text-white mb-8">Terms of Service</h1>
        <article className="prose prose-invert prose-olive max-w-none">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>
            By using Georgia Low-Cost Land Finder, you agree to these terms. We provide a platform for data aggregation and research. 
            We do not sell real estate, nor do we act as a broker, agent, or legal advisor.
          </p>
          
          <h3>1. Data Accuracy and Liability</h3>
          <p>
            All property data is sourced from public county records, land banks, and municipal surplus sites. We do not guarantee the accuracy, completeness, or timeliness of this data. Properties may be sold, withdrawn, or have different pricing/status than displayed.
          </p>

          <h3>2. Tax Sales and Risks</h3>
          <p>
            Georgia tax deed sales involve significant risks, including a one-year right of redemption. You acknowledge that purchasing a tax deed does not grant immediate clear title.
          </p>
          
          <h3>3. Subscriptions and Refunds</h3>
          <p>
            Digital reports and data exports are final sale and non-refundable once downloaded. Subscription access can be canceled at any time to prevent future billing.
          </p>
        </article>
      </section>
    </div>
  );
}
