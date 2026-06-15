import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

/**
 * Inline day/night switch. Designed to live INSIDE a header (marketing nav or
 * dashboard header) on both desktop and mobile — it no longer positions itself.
 */
export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={`theme-toggle inline-flex shrink-0 items-center rounded-full border border-white/10 bg-olive-950/75 p-0.5 text-[11px] font-bold shadow-sm backdrop-blur-xl transition-colors day-toggle-shell ${className}`}
      role="group"
      aria-label="Site color theme"
    >
      <button
        type="button"
        onClick={() => setTheme('day')}
        aria-pressed={theme === 'day'}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
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
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
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
