import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Download, Layers } from 'lucide-react';

export default function ReportSuccessPage() {
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

      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <CheckCircle2 className="mx-auto text-brand-500 mb-6" size={64} />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">Payment Successful!</h1>
          <p className="text-xl text-olive-400 mb-12">
            Thank you for purchasing the Georgia Low-Cost Land Report. Your downloads are ready below.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="card flex flex-col items-center p-8 bg-olive-800/30 border-olive-700">
              <Download className="text-olive-300 mb-4" size={32} />
              <h3 className="text-xl font-display font-bold text-white mb-2">PDF Report</h3>
              <p className="text-sm text-olive-400 mb-6 text-center">Comprehensive 25-50 curated leads with risk notes and source links.</p>
              <button className="w-full btn-secondary justify-center mt-auto">
                Download PDF
              </button>
            </div>
            
            <div className="card flex flex-col items-center p-8 bg-olive-800/30 border-olive-700">
              <Download className="text-olive-300 mb-4" size={32} />
              <h3 className="text-xl font-display font-bold text-white mb-2">CSV Dataset</h3>
              <p className="text-sm text-olive-400 mb-6 text-center">The raw data for all leads, ready for import into your CRM or spreadsheet.</p>
              <button className="w-full btn-secondary justify-center mt-auto">
                Download CSV
              </button>
            </div>
          </div>

          <div className="mt-16 p-6 bg-brand-900/20 border border-brand-500/30 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-2">Next Steps</h3>
            <p className="text-olive-300 text-sm">
              We've also sent a receipt to your email. If you upgrade to a dashboard subscription later, this report will automatically sync to your saved leads.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
