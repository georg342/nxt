import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

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

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

/**
 * Returns a new Date set to Monday 00:00 of the week containing `date`.
 * @param {Date} date
 * @returns {Date}
 */
function getMondayOfWeek(date) {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Formats a Date as "MMM D" (e.g., "Oct 14").
 * @param {Date} date
 * @returns {string}
 */
function formatShortDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

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
    const currentDate = ref(new Date())
    const transitionDirection = ref(DEFAULT_TRANSITION)

    const contextLabel = computed(() => {
      const date = currentDate.value

      if (activeView.value === 'year') {
        return String(date.getFullYear())
      }

      if (activeView.value === 'month') {
        return new Intl.DateTimeFormat('en-US', {
          month: 'long',
          year: 'numeric',
        }).format(date)
      }

      if (activeView.value === 'week') {
        const monday = getMondayOfWeek(date)
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)

        const sameMonth = monday.getMonth() === sunday.getMonth()
        const startLabel = sameMonth
          ? formatShortDate(monday).split(' ')[1]
          : formatShortDate(monday)
        const endLabel = formatShortDate(sunday)

        return sameMonth
          ? `${formatShortDate(monday).split(' ')[0]} ${startLabel} - ${endLabel}`
          : `${startLabel} - ${endLabel}`
      }

      return ''
    })

    const weekDaysData = computed(() => {
      const monday = getMondayOfWeek(currentDate.value)
      return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(monday)
        day.setDate(monday.getDate() + i)
        return {
          dateNum: day.getDate(),
          dayName: DAY_NAMES[day.getDay()],
        }
      })
    })

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
      const next = new Date(currentDate.value)
      next.setDate(next.getDate() + 7)
      currentDate.value = next
    }

    return {
      theme,
      activeView,
      currentDate,
      transitionDirection,
      contextLabel,
      weekDaysData,
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
