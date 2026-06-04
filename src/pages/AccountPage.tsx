import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogOut, ArrowRight, MapPin, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function AccountPage() {
  const { user, profile, accessLevel, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getPlanName = () => {
    switch (accessLevel) {
      case 'admin': return 'Admin';
      case 'dashboard_investor': return 'Dashboard Investor';
      case 'dashboard_pro': return 'Dashboard Pro';
      case 'dashboard_starter': return 'Dashboard Starter';
      case 'report_buyer': return 'Report Buyer';
      case 'alerts_subscriber': return 'Alerts Subscriber';
      default: return 'Free Preview';
    }
  };

  const plans = [
    {
      level: 'dashboard_starter',
      name: 'Starter',
      price: '$39',
      features: ['Full 10,000+ lead database', 'Advanced filters & map view', 'Updates every 48 hours'],
      url: import.meta.env.VITE_DASHBOARD_STARTER_CHECKOUT_URL || '',
    },
    {
      level: 'dashboard_pro',
      name: 'Pro',
      price: '$79',
      features: ['Everything in Starter', 'Favorites, Notes & Lead Cards', 'Unlimited CSV Exports'],
      url: import.meta.env.VITE_DASHBOARD_PRO_CHECKOUT_URL || '',
      highlight: true,
    },
    {
      level: 'dashboard_investor',
      name: 'Investor',
      price: '$149',
      features: ['Everything in Pro', 'Direct Agency Contacts', 'Priority Deal Workflows', 'Commercial Monetization Matrix'],
      url: import.meta.env.VITE_DASHBOARD_INVESTOR_CHECKOUT_URL || '',
    }
  ];

  return (
    <div className="min-h-screen bg-olive-950 text-olive-50 font-sans">
      <nav className="border-b border-surface-border bg-olive-900/50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-brand-600 rounded flex items-center justify-center">
              <MapPin size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-white tracking-tight group-hover:text-brand-200 transition-colors">
              Georgia Land Finder
            </span>
          </Link>
          <Link to="/dashboard" className="btn-ghost border-surface-border text-sm">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-display font-bold text-white mb-8">My Account</h1>

        <div className="grid md:grid-cols-[1fr_300px] gap-8 items-start">
          {/* Main Info */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-bold text-white mb-4">Profile Details</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-olive-400 block mb-1">Email Address</span>
                  <div className="font-medium text-white">{profile?.email || user?.email}</div>
                </div>
                <div>
                  <span className="text-olive-400 block mb-1">Account ID</span>
                  <div className="font-mono text-xs text-olive-500 break-all">{user?.id}</div>
                </div>
              </div>
            </div>

            <div className="card p-6 border-brand-900/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={20} className="text-brand-500" />
                  Current Plan
                </h2>
                <span className="px-3 py-1 bg-brand-900 text-brand-400 text-xs font-bold rounded-full font-mono uppercase tracking-wider">
                  {getPlanName()}
                </span>
              </div>
              
              <p className="text-sm text-olive-300 mb-6 leading-relaxed">
                You currently have <strong>{getPlanName()}</strong> access. Upgrade your plan below to unlock full database features, unlimited exports, and agency contact workflows.
              </p>

              {accessLevel === 'free_preview' || accessLevel === 'report_buyer' ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <div key={plan.name} className={`rounded-xl border p-4 flex flex-col ${
                      plan.highlight ? 'border-brand-500 bg-brand-950/20' : 'border-surface-border bg-olive-900/50'
                    }`}>
                      <div className="text-sm font-bold text-white mb-1">{plan.name}</div>
                      <div className="text-xl font-display font-bold text-brand-400 mb-3">{plan.price}<span className="text-xs text-olive-500 font-sans">/mo</span></div>
                      <ul className="space-y-2 mb-4 flex-1">
                        {plan.features.map((f, i) => (
                          <li key={i} className="text-xs text-olive-300 flex items-start gap-1.5">
                            <CheckCircle2 size={12} className="text-brand-500 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      {plan.url ? (
                        <a href={plan.url} className={`w-full py-2 rounded-lg text-xs font-bold text-center transition-colors ${
                          plan.highlight ? 'bg-brand-500 text-olive-950 hover:bg-brand-400' : 'bg-olive-800 text-white hover:bg-olive-700'
                        }`}>
                          Upgrade to {plan.name}
                        </a>
                      ) : (
                        <button disabled className={`w-full py-2 rounded-lg text-xs font-bold text-center opacity-50 cursor-not-allowed ${
                          plan.highlight ? 'bg-brand-500 text-olive-950' : 'bg-olive-800 text-white'
                        }`}>
                          Coming Soon
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-olive-900/50 rounded-lg p-4 border border-surface-border text-sm text-olive-400 flex items-center justify-between">
                  <span>To change or cancel your subscription, please visit the billing portal.</span>
                  <a href="#" className="btn-secondary text-xs">Billing Portal</a>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-sm font-bold text-white mb-4">Quick Links</h3>
              <div className="space-y-3">
                <Link to="/dashboard" className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300">
                  <MapPin size={16} /> Open Dashboard
                </Link>
                <Link to="/report" className="flex items-center gap-2 text-sm text-olive-300 hover:text-white">
                  <FileText size={16} /> View Static Report
                </Link>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-accent-danger/30 text-accent-danger text-sm font-bold hover:bg-accent-danger/10 transition-colors"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
