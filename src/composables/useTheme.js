/**
 * Theme Composable
 * Manages light/dark theme switching and persistence
 */

import { ref, onMounted, watch } from 'vue'
import { auth } from '@/services/api'

const DEFAULT_THEME = 'light'

function getThemeKey() {
  const institution = auth.getInstitution() || 'default'
  return `lms-theme-preference-${institution}`
}

// Shared state across all instances
const currentTheme = ref(DEFAULT_THEME)

export function useTheme() {
  /**
   * Get theme from localStorage or system preference
   */
  const getInitialTheme = () => {
    // Check localStorage first
    const stored = localStorage.getItem(getThemeKey())
    if (stored === 'light' || stored === 'dark') {
      return stored
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }

    return DEFAULT_THEME
  }

  /**
   * Apply theme to document
   */
  const applyTheme = (theme) => {
    // Ajouter/retirer la classe 'dark' pour Tailwind CSS
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Garder aussi l'attribut data-theme pour compatibilité
    document.documentElement.setAttribute('data-theme', theme)
  }

  /**
   * Set theme
   */
  const setTheme = (theme) => {
    if (theme !== 'light' && theme !== 'dark') {
      console.warn(`Invalid theme: ${theme}. Using default.`)
      theme = DEFAULT_THEME
    }

    currentTheme.value = theme
    applyTheme(theme)
    localStorage.setItem(getThemeKey(), theme)
  }

  /**
   * Toggle between light and dark
   */
  const toggleTheme = () => {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  /**
   * Check if dark mode is active
   */
  const isDark = () => {
    return currentTheme.value === 'dark'
  }

  /**
   * Check if light mode is active
   */
  const isLight = () => {
    return currentTheme.value === 'light'
  }

  /**
   * Listen to system theme changes
   */
  const watchSystemTheme = () => {
    if (!window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e) => {
      // Only auto-switch if user hasn't set a preference
      if (!localStorage.getItem(getThemeKey())) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }

  // Initialize theme on mount
  onMounted(() => {
    const initialTheme = getInitialTheme()
    setTheme(initialTheme)
    watchSystemTheme()
  })

  // Watch for changes and apply
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme)
  })

  return {
    theme: currentTheme,
    setTheme,
    toggleTheme,
    isDark,
    isLight
  }
}
