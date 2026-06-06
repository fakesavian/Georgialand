import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type SiteTheme = 'day' | 'night';

const SITE_THEME_KEY = 'glf_site_theme';
const LEGACY_FREE_TIER_THEME_KEY = 'glf_free_tier_theme';

interface ThemeContextType {
  theme: SiteTheme;
  setTheme: (theme: SiteTheme) => void;
  toggleTheme: () => void;
  isNight: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readInitialTheme(): SiteTheme {
  if (typeof window === 'undefined') return 'night';

  const stored = window.localStorage.getItem(SITE_THEME_KEY);
  if (stored === 'day' || stored === 'night') return stored;

  const legacy = window.localStorage.getItem(LEGACY_FREE_TIER_THEME_KEY);
  if (legacy === 'day' || legacy === 'night') return legacy;

  return 'night';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<SiteTheme>(() => readInitialTheme());

  const setTheme = (nextTheme: SiteTheme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(SITE_THEME_KEY, nextTheme);
    window.localStorage.setItem(LEGACY_FREE_TIER_THEME_KEY, nextTheme);
  };

  const toggleTheme = () => setTheme(theme === 'night' ? 'day' : 'night');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    document.body.style.colorScheme = theme === 'night' ? 'dark' : 'light';
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, isNight: theme === 'night' }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
