import React from 'react';
import { useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div
      className={`theme-toggle ${isDashboard ? 'theme-toggle--dashboard' : 'theme-toggle--site'} fixed right-4 top-4 z-[1000] inline-flex rounded-full border border-white/10 bg-olive-950/75 p-0.5 text-[11px] font-bold shadow-lg shadow-black/15 backdrop-blur-xl transition-colors day-toggle-shell`}
      aria-label="Site color theme"
    >
      <button
        type="button"
        onClick={() => setTheme('day')}
        aria-pressed={theme === 'day'}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          theme === 'day'
            ? 'bg-white text-brand-700 shadow-sm'
            : 'text-olive-300 hover:bg-white/10 hover:text-white'
        }`}
        title="Day mode"
      >
        <Sun size={14} />
        <span className="sr-only">Day</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('night')}
        aria-pressed={theme === 'night'}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          theme === 'night'
            ? 'bg-brand-600 text-white shadow-sm'
            : 'text-olive-300 hover:bg-white/10 hover:text-white'
        }`}
        title="Night mode"
      >
        <Moon size={14} />
        <span className="sr-only">Night</span>
      </button>
    </div>
  );
}
