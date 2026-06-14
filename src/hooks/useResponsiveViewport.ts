import * as React from 'react';

function getMediaQuery(query: string, fallback = false) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return fallback;
  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: string, fallback = false) {
  const [matches, setMatches] = React.useState(() => getMediaQuery(query, fallback));

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 900px)');
}

export function useIsPhonePortrait() {
  return useMediaQuery('(max-width: 640px) and (orientation: portrait)');
}

export function useIsCompactLandscape() {
  return useMediaQuery('(orientation: landscape) and (max-height: 560px)');
}

export function useSafeViewportHeight() {
  const [height, setHeight] = React.useState(() => (typeof window === 'undefined' ? 0 : window.innerHeight));

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const update = () => setHeight(window.visualViewport?.height || window.innerHeight);
    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  return height;
}
