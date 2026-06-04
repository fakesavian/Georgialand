import posthog from 'posthog-js';

// Initialize Analytics Providers
export function initAnalytics() {
  // 1. PostHog Initialization
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      autocapture: false, // We'll rely on manual tracking or explicit autocapture config if needed
      capture_pageview: false, // We handle this manually with React Router
    });
  } else if (import.meta.env.DEV) {
    console.warn('[Analytics] VITE_POSTHOG_KEY is missing. PostHog is disabled.');
  }

  // 2. Microsoft Clarity Initialization
  const clarityId = import.meta.env.VITE_CLARITY_PROJECT_ID;
  if (clarityId && typeof window !== 'undefined') {
    (function(c,l,a,r,i,t,y){
      // @ts-ignore
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      // @ts-ignore
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      // @ts-ignore
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", clarityId);
  } else if (import.meta.env.DEV && !clarityId) {
    console.warn('[Analytics] VITE_CLARITY_PROJECT_ID is missing. Clarity is disabled.');
  }
}

// Wrapper for event tracking
export function trackEvent(category: string, action: string, label?: string, value?: number) {
  // Always log in dev for debugging
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${action}`, { category, label, value });
  }

  // Fire to PostHog if initialized
  if (import.meta.env.VITE_POSTHOG_KEY) {
    try {
      posthog.capture(action, { category, label, value });
    } catch (e) {
      console.error('[Analytics] Failed to capture event:', e);
    }
  }
}
