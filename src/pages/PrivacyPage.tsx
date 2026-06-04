import React from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-display font-bold text-white mb-8">Privacy Policy</h1>
        <article className="prose prose-invert prose-olive max-w-none">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>
            Your privacy is important to us. This policy outlines how we collect, use, and protect your information when you use Georgia Low-Cost Land Finder.
          </p>
          
          <h3>1. Information We Collect</h3>
          <p>
            We collect information you provide directly to us (e.g., email addresses for samples or accounts) and automatically collected information (e.g., analytics and cookies).
          </p>

          <h3>2. How We Use Your Information</h3>
          <p>
            We use your data to deliver the products you requested, send alert emails if subscribed, and improve the user experience through basic analytics.
          </p>
          
          <h3>3. Payment Information</h3>
          <p>
            All payment processing is handled securely by Stripe. We do not store or process your credit card details on our servers.
          </p>

          <h3>4. Contact Us</h3>
          <p>
            If you have questions about this privacy policy or your data, please contact us.
          </p>
        </article>
      </section>
    </div>
  );
}
