import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, Layers, ArrowLeft } from 'lucide-react';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-olive-950 text-olive-50 font-sans flex flex-col">
      <nav className="border-b border-surface-border bg-olive-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <Layers className="text-brand-500" size={24} />
            <span className="font-display font-bold text-lg text-white tracking-tight">Georgia Land Finder</span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full panel p-8 text-center flex flex-col items-center">
          <XCircle className="text-olive-500 mb-6" size={64} />
          <h1 className="text-3xl font-display font-bold text-white mb-4">Checkout Cancelled</h1>
          <p className="text-olive-300 mb-8 leading-relaxed">
            Your checkout process was cancelled and you have not been charged.
          </p>
          <Link to="/pricing" className="btn-secondary w-full justify-center">
            <ArrowLeft size={16} className="mr-2" /> Return to Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
