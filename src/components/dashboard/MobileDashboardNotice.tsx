import React from 'react';
import { Smartphone, X } from 'lucide-react';
import { useIsPhonePortrait } from '../../hooks/useResponsiveViewport';

const DISMISS_KEY = 'glf_mobile_dashboard_notice_dismissed';

/**
 * One-time, dismissible notice shown only on phone-sized screens when entering
 * the dashboard. Never appears on desktop/tablet or the landing page, and the
 * dismissal persists in localStorage so it does not nag on every visit.
 */
export default function MobileDashboardNotice() {
  const isPhone = useIsPhonePortrait();
  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      return window.localStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  if (!isPhone || dismissed) return null;

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      /* ignore storage failures — still dismiss for this session */
    }
    setDismissed(true);
  };

  return (
    <div className="mobile-dashboard-notice" role="dialog" aria-modal="true" aria-label="Mobile dashboard beta">
      <button
        type="button"
        className="mobile-dashboard-notice__backdrop"
        aria-label="Dismiss notice"
        onClick={handleDismiss}
      />
      <div className="mobile-dashboard-notice__card">
        <div className="mobile-dashboard-notice__head">
          <span className="mobile-dashboard-notice__icon">
            <Smartphone size={18} />
          </span>
          <p className="mobile-dashboard-notice__eyebrow">Mobile dashboard beta</p>
          <button
            type="button"
            onClick={handleDismiss}
            className="mobile-dashboard-notice__close"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
        <p className="mobile-dashboard-notice__body">
          Browse the map, filter land leads, and save favorites — all from your phone. Tap a card
          to see full details, or use the bottom nav to switch views.
        </p>
        <button type="button" onClick={handleDismiss} className="btn-primary h-12 w-full text-sm">
          Start exploring
        </button>
      </div>
    </div>
  );
}
