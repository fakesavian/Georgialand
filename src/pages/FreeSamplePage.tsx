import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import SponsorBanner from '../components/marketing/SponsorBanner';
import SEO from '../components/SEO';
import { sponsors } from '../data/sponsors';

export default function FreeSamplePage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    buyerType: 'Just researching'
  });
  
  const reportSponsors = sponsors.filter(s => s.active && s.placements.includes('report'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    trackEvent('Marketing', 'free_sample_signup', 'Free Sample Page');

    try {
      // Basic event tracking (will log to console or whatever analytics provider is hooked up)
      console.log('[Analytics] Track Event: free_sample_signup', formData);

      const response = await fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          email: formData.email,
          buyer_type: formData.buyerType
        })
      });

      // Even if it fails (like a 404 in local dev without Vercel CLI), we still let them proceed to the download page
      if (!response.ok) {
        console.warn('API returned an error, proceeding to download fallback.');
      }
    } catch (err) {
      console.warn('API call failed, proceeding to download fallback.', err);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-olive-950 text-olive-50 font-sans">
      <SEO 
        title="Free Georgia Land Lead Sample | 10 Off-Market Lots"
        description="Download a free sample of 10 low-cost land opportunities in Georgia. Includes parcel data, pricing, and acquisition steps."
        canonicalUrl="https://georgialandfinder.com/free-sample"
      />
      <nav className="border-b border-surface-border bg-olive-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Layers className="text-brand-500" size={24} />
            <span className="font-display font-bold text-lg text-white tracking-tight">Georgia Land Finder</span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <Link to="/pricing" className="text-olive-300 hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>
      </nav>

      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 tracking-tight">Get your free 10-lead sample</h1>
            <p className="text-lg text-olive-300 mb-8 leading-relaxed">
              We'll send you 10 hand-curated Georgia land opportunities straight to your inbox. Includes source links, risk notes, and next-step checklists.
            </p>
            <ul className="space-y-4 text-sm text-olive-300">
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-brand-500 shrink-0" size={20} /> Proven land-bank and surplus lots</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-brand-500 shrink-0" size={20} /> Direct links to official sources</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="text-brand-500 shrink-0" size={20} /> Clear risk and data-missing flags</li>
            </ul>
            
            <div className="mt-12 hidden md:block">
              <h3 className="text-sm font-semibold text-olive-400 mb-4 uppercase tracking-wider">Trusted Resources</h3>
              {reportSponsors.map(sponsor => (
                <SponsorBanner
                  key={sponsor.id}
                  sponsor={sponsor}
                />
              ))}
            </div>
          </div>
          
          <div className="panel p-8">
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle2 className="text-brand-500 mx-auto" size={48} />
                <h3 className="text-2xl font-display font-bold text-white">Sample Sent!</h3>
                <p className="text-olive-400">Check your email for the 10-lead sample.</p>
                <div className="pt-6">
                  <a href={import.meta.env.VITE_FREE_SAMPLE_FILE || '/free_georgia_land_10_lead_sample.csv'} download className="btn-primary w-full justify-center py-3">Download Now (CSV)</a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-olive-400 mb-1.5 uppercase tracking-wider">First Name</label>
                  <input 
                    required 
                    type="text" 
                    className="input w-full" 
                    placeholder="John" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-olive-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 text-olive-500" size={18} />
                    <input 
                      required 
                      type="email" 
                      className="input w-full pl-10" 
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-olive-400 mb-1.5 uppercase tracking-wider">Buyer Type</label>
                  <select 
                    className="select w-full"
                    value={formData.buyerType}
                    onChange={(e) => setFormData({...formData, buyerType: e.target.value})}
                  >
                    <option>Just researching</option>
                    <option>First-time buyer</option>
                    <option>Investor</option>
                    <option>Builder</option>
                    <option>Nonprofit</option>
                    <option>Developer</option>
                  </select>
                </div>
                <button type="submit" disabled={loading} className="w-full btn-primary py-3 mt-4 justify-center">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Me the Free Sample'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
