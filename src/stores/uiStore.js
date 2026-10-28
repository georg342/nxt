import { defineStore } from 'pinia'
import { ref } from 'vue'

const THEME_LIGHT = 'light'
const THEME_DARK = 'dark'
const DEFAULT_THEME = THEME_LIGHT

/**
 * Applies the given theme to the <html> element via the data-theme attribute.
 * @param {'light' | 'dark'} theme
 */
function applyThemeToDocument(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

export const useUIStore = defineStore(
  'ui',
  () => {
    const theme = ref(DEFAULT_THEME)

    /**
     * Sets the theme and applies it to the document.
     * @param {'light' | 'dark'} newTheme
     */
    function setTheme(newTheme) {
      theme.value = newTheme === THEME_DARK ? THEME_DARK : THEME_LIGHT
      applyThemeToDocument(theme.value)
    }

    /**
     * Toggles between light and dark themes.
     */
    function toggleTheme() {
      setTheme(theme.value === THEME_DARK ? THEME_LIGHT : THEME_DARK)
    }

    /**
     * Ensures the current theme is applied to the document.
     * Useful on app bootstrap after persisted state hydration.
     */
    function initTheme() {
      applyThemeToDocument(theme.value)
    }

    return {
      theme,
      setTheme,
      toggleTheme,
      initTheme,
    }
  },
  {
    persist: {
      key: 'wnxt-ui',
      pick: ['theme'],
    },
  }
)
