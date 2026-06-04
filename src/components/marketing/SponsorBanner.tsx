import React, { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';
import { Sponsor } from '../../types';

interface SponsorBannerProps {
  sponsor: Sponsor;
  className?: string;
}

export default function SponsorBanner({ sponsor, className = '' }: SponsorBannerProps) {
  useEffect(() => {
    trackEvent('Monetization', 'sponsor_impression', sponsor.id);
  }, [sponsor.id]);

  const handleClick = () => {
    trackEvent('Monetization', 'sponsor_click', sponsor.id);
  };

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br from-olive-900/60 to-olive-900/20 hover:from-olive-800/80 hover:to-olive-900/40 transition-all ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold uppercase tracking-widest text-olive-500">Partner: {sponsor.category}</span>
      </div>
      <h4 className="text-white font-display font-medium text-sm mb-1">{sponsor.name}</h4>
      <p className="text-xs text-olive-400 mb-3 leading-relaxed">{sponsor.description}</p>
      <a 
        href={sponsor.url} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={handleClick}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition-colors"
      >
        Learn More <ExternalLink size={10} />
      </a>
    </div>
  );
}
