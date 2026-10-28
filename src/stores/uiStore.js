import { defineStore } from 'pinia'
import { ref } from 'vue'

const THEME_LIGHT = 'light'
const THEME_DARK = 'dark'
const DEFAULT_THEME = THEME_LIGHT

const VALID_VIEWS = ['year', 'month', 'week', 'day']
const DEFAULT_VIEW = 'year'

const VIEW_DEPTH = {
  year: 1,
  month: 2,
  week: 3,
  day: 4,
}

const DEFAULT_TRANSITION = 'ios-push'

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
    const activeView = ref(DEFAULT_VIEW)
    const weekOffset = ref(0)
    const transitionDirection = ref(DEFAULT_TRANSITION)

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

    /**
     * Sets the active calendar view.
     * @param {'year' | 'month' | 'week' | 'day'} viewName
     */
    function setActiveView(viewName) {
      if (!VALID_VIEWS.includes(viewName)) return
      if (viewName === activeView.value) return

      const currentDepth = VIEW_DEPTH[activeView.value] ?? 0
      const nextDepth = VIEW_DEPTH[viewName] ?? 0

      transitionDirection.value =
        nextDepth >= currentDepth ? 'ios-push' : 'ios-pop'

      activeView.value = viewName
    }

    /**
     * Advances to the next week.
     */
    function nextWeek() {
      weekOffset.value += 1
    }

    return {
      theme,
      activeView,
      weekOffset,
      transitionDirection,
      setTheme,
      toggleTheme,
      initTheme,
      setActiveView,
      nextWeek,
    }
  },
  {
    persist: {
      key: 'wnxt-ui',
      pick: ['theme', 'activeView'],
    },
  }
)
