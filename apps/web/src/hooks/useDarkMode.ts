/**
 * Dark Mode Hook
 * Manages theme state, persistence, and system preference detection
 */

import { useEffect, useCallback } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

export interface UseDarkModeReturn {
  theme: ThemePreference;
  systemTheme: EffectiveTheme;
  effectiveTheme: EffectiveTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

/**
 * Apply theme to DOM by adding/removing 'dark' class
 */
function applyThemeToDom(theme: EffectiveTheme): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Custom hook for managing dark mode state and persistence
 *
 * TEMPORARILY DISABLED: Always returns 'light' theme
 * Dark mode functionality is disabled until further notice
 */
export function useDarkMode(): UseDarkModeReturn {
  // Always use light theme
  const theme: ThemePreference = 'light';
  const systemTheme: EffectiveTheme = 'light';
  const effectiveTheme: EffectiveTheme = 'light';

  /**
   * Set theme preference (no-op, always light)
   */
  const setTheme = useCallback((_newTheme: ThemePreference) => {
    // No-op: theme is always light
  }, []);

  /**
   * Toggle theme (no-op, always light)
   */
  const toggleTheme = useCallback(() => {
    // No-op: theme is always light
  }, []);

  /**
   * Ensure light theme is applied to DOM
   */
  useEffect(() => {
    applyThemeToDom('light');
  }, []);

  return {
    theme,
    systemTheme,
    effectiveTheme,
    setTheme,
    toggleTheme,
  };
}
