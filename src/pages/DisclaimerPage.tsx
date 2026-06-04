import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ShieldAlert } from 'lucide-react';

export default function DisclaimerPage() {
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
        <ShieldAlert className="text-accent-warning mb-6" size={48} />
        <h1 className="text-4xl font-display font-bold text-white mb-8">Legal & Real Estate Disclaimer</h1>
        
        <article className="prose prose-invert prose-olive max-w-none">
          <p className="text-xl text-olive-300 font-semibold mb-8">
            Georgia Low-Cost Land Finder is a research and data-aggregation service, NOT a real estate brokerage, law firm, title company, or financial advisory service.
          </p>

          <h3>No Professional Advice</h3>
          <p>
            The information provided on this website, in our reports, and within our dashboard is for informational purposes only. It should not be construed as legal advice, financial advice, or an offer to buy or sell real estate.
          </p>
          
          <h3>Data Reliability</h3>
          <p>
            While we strive to provide accurate and up-to-date information by aggregating county records, municipal listings, and land bank data, we make no warranties or representations regarding the accuracy, completeness, or reliability of any property listing. 
          </p>

          <h3>User Responsibility and Due Diligence</h3>
          <p>
            Users are solely responsible for conducting their own due diligence before purchasing or bidding on any property. This includes, but is not limited to:
          </p>
          <ul>
            <li>Verifying zoning laws and building restrictions with local authorities.</li>
            <li>Conducting professional title searches to identify liens, back taxes, or clouded titles.</li>
            <li>Consulting with real estate attorneys, especially regarding tax deed sales and the right of redemption in Georgia.</li>
            <li>Obtaining professional surveys to confirm property boundaries and access.</li>
            <li>Performing environmental and soil tests.</li>
          </ul>

          <div className="bg-accent-warning/20 border border-accent-warning/40 p-6 rounded-xl mt-8">
            <h4 className="text-accent-warning font-bold mt-0">Special Warning Regarding Tax Sales</h4>
            <p className="text-accent-warning text-sm mb-0">
              Georgia is a redeemable tax deed state. Purchasing a tax deed at auction does NOT give you immediate clear title to the property. The original owner has a minimum 12-month redemption period. You must follow strict legal procedures to foreclose the right of redemption. Always consult a Georgia real estate attorney before participating in tax sales.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
