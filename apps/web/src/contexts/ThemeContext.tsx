/* eslint-disable react-refresh/only-export-components */
/**
 * Theme Context Provider
 * Provides theme state to deeply nested components without prop drilling
 */

import { createContext, useContext, type ReactNode } from 'react'
import { useDarkMode, type ThemePreference, type EffectiveTheme } from '@/hooks/useDarkMode'

export interface ThemeContextValue {
  theme: ThemePreference
  systemTheme: EffectiveTheme
  effectiveTheme: EffectiveTheme
  setTheme: (theme: ThemePreference) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export interface ThemeProviderProps {
  children: ReactNode
}

/**
 * ThemeProvider component
 * Wraps the application and provides theme state via context
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const darkMode = useDarkMode()

  return (
    <ThemeContext.Provider value={darkMode}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * useTheme hook
 * Consumes theme context and provides theme state and controls
 *
 * @throws {Error} If used outside of ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
