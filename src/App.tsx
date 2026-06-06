import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';
import FreeSamplePage from './pages/FreeSamplePage';
import DocsPage from './pages/DocsPage';
import FAQPage from './pages/FAQPage';
import ReportPage from './pages/ReportPage';
import AlertsPage from './pages/AlertsPage';
import AdminPage from './pages/AdminPage';
import AccountPage from './pages/AccountPage';

import DisclaimerPage from './pages/DisclaimerPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

import ReportSuccessPage from './pages/ReportSuccessPage';
import SeoLandingPage from './pages/SeoLandingPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

import { AuthProvider } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { initAnalytics, trackEvent } from './lib/analytics';
import posthog from 'posthog-js';
import { HelmetProvider } from 'react-helmet-async';

// Initialize analytics globally
initAnalytics();

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Standard PostHog Pageview
    if (import.meta.env.VITE_POSTHOG_KEY) {
      posthog.capture('$pageview');
    }

    // Specific custom views requested by roadmap
    const path = location.pathname;
    if (path === '/') trackEvent('Pageview', 'landing_view', 'Landing Page');
    else if (path === '/pricing') trackEvent('Pageview', 'pricing_view', 'Pricing Page');
    else if (path === '/dashboard') trackEvent('Pageview', 'dashboard_view', 'Dashboard');
    else if (path === '/docs') trackEvent('Pageview', 'docs_view', 'Docs Page');
    else if (path === '/faq') trackEvent('Pageview', 'faq_view', 'FAQ Page');
  }, [location]);

  return null;
}

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
        <Router>
          <AnalyticsTracker />
          <ThemeToggle />
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />

          {/* Public Routes */}
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/free-sample" element={<FreeSamplePage />} />
          <Route path="/free-tier" element={<FreeSamplePage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/report-success" element={<ReportSuccessPage />} />
          <Route path="/checkout-success" element={<CheckoutSuccessPage />} />
          <Route path="/checkout-cancel" element={<CheckoutCancelPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
        
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        
        <Route path="/404" element={<NotFoundPage />} />

        {/* Dynamic SEO Landing Pages — unknown slugs render 404 */}
        <Route path="/:slug" element={<SeoLandingPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </HelmetProvider>
  );
}
