import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogOut, ArrowRight, MapPin, CheckCircle2, ShieldCheck, FileText, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PAID_PLANS, PaidPlanId } from '../lib/stripePlans';
import { openBillingPortal, startCheckout } from '../lib/stripeClient';

export default function AccountPage() {
  const { user, profile, accessLevel, signOut } = useAuth();
  const [checkoutPlan, setCheckoutPlan] = useState<PaidPlanId | null>(null);
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCheckout = async (planId: PaidPlanId) => {
    setBillingError(null);
    setCheckoutPlan(planId);
    try {
      await startCheckout(planId, 'monthly');
    } catch (err: any) {
      setBillingError(err?.message || 'Unable to start checkout. Please try again.');
      setCheckoutPlan(null);
    }
  };

  const handleBillingPortal = async () => {
    setBillingError(null);
    setBillingPortalLoading(true);
    try {
      await openBillingPortal();
    } catch (err: any) {
      setBillingError(err?.message || 'Unable to open the billing portal. Please try again.');
      setBillingPortalLoading(false);
    }
  };

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

  const plans = PAID_PLANS;

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

              {billingError && (
                <div className="mb-4 rounded-lg border border-accent-danger/40 bg-accent-danger/10 p-3 text-sm text-accent-danger">
                  {billingError}
                </div>
              )}

              {accessLevel === 'free_preview' || accessLevel === 'report_buyer' ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <div key={plan.name} className={`rounded-xl border p-4 flex flex-col ${
                      plan.id === 'pro' ? 'border-brand-500 bg-brand-950/20' : 'border-surface-border bg-olive-900/50'
                    }`}>
                      <div className="text-sm font-bold text-white mb-1">{plan.name.replace('Dashboard ', '')}</div>
                      <div className="text-xl font-display font-bold text-brand-400 mb-3">{plan.monthlyPrice}<span className="text-xs text-olive-500 font-sans">/mo</span></div>
                      <ul className="space-y-2 mb-4 flex-1">
                        {plan.features.map((f, i) => (
                          <li key={i} className="text-xs text-olive-300 flex items-start gap-1.5">
                            <CheckCircle2 size={12} className="text-brand-500 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        disabled={checkoutPlan === plan.id}
                        onClick={() => handleCheckout(plan.id)}
                        className={`w-full py-2 rounded-lg text-xs font-bold text-center transition-colors ${
                          plan.id === 'pro' ? 'bg-brand-500 text-olive-950 hover:bg-brand-400' : 'bg-olive-800 text-white hover:bg-olive-700'
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {checkoutPlan === plan.id ? (
                          <span className="inline-flex items-center justify-center gap-1.5">
                            <Loader2 size={12} className="animate-spin" /> Redirecting...
                          </span>
                        ) : (
                          `Upgrade to ${plan.name.replace('Dashboard ', '')}`
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-olive-900/50 rounded-lg p-4 border border-surface-border text-sm text-olive-400 flex items-center justify-between">
                  <span>To change or cancel your subscription, please visit the billing portal.</span>
                  <button
                    type="button"
                    onClick={handleBillingPortal}
                    disabled={billingPortalLoading}
                    className="btn-secondary text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {billingPortalLoading ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin" /> Opening...
                      </span>
                    ) : (
                      'Billing Portal'
                    )}
                  </button>
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
