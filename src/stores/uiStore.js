import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import i18n from '../i18n'

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

const DEFAULT_LOCALE = 'pt'
const LOCALE_MAP = {
  pt: 'pt-BR',
  en: 'en-US',
}

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
 * @param {string} intlLocale
 * @returns {string}
 */
function formatShortDate(date, intlLocale) {
  return new Intl.DateTimeFormat(intlLocale, {
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
    const locale = ref(DEFAULT_LOCALE)
    const activeView = ref(DEFAULT_VIEW)
    const currentDate = ref(new Date())
    const selectedDate = ref(null)
    const transitionDirection = ref(DEFAULT_TRANSITION)

    const intlLocale = computed(() => LOCALE_MAP[locale.value] ?? 'en-US')

    const contextLabel = computed(() => {
      const date = currentDate.value
      const intl = intlLocale.value

      if (activeView.value === 'year') {
        return String(date.getFullYear())
      }

      if (activeView.value === 'month') {
        const formatted = new Intl.DateTimeFormat(intl, {
          month: 'long',
          year: 'numeric',
        }).format(date)
        return formatted.charAt(0).toUpperCase() + formatted.slice(1)
      }

      if (activeView.value === 'week') {
        const monday = getMondayOfWeek(date)
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)

        const sameMonth = monday.getMonth() === sunday.getMonth()
        const startLabel = sameMonth
          ? formatShortDate(monday, intl).split(' ')[1]
          : formatShortDate(monday, intl)
        const endLabel = formatShortDate(sunday, intl)

        return sameMonth
          ? `${formatShortDate(monday, intl).split(' ')[0]} ${startLabel} - ${endLabel}`
          : `${startLabel} - ${endLabel}`
      }

      if (activeView.value === 'day') {
        const target = selectedDate.value ?? date
        const formatted = new Intl.DateTimeFormat(intl, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }).format(target)
        return formatted.charAt(0).toUpperCase() + formatted.slice(1)
      }

      return ''
    })

    const weekDaysData = computed(() => {
      const monday = getMondayOfWeek(currentDate.value)
      const intl = intlLocale.value
      const weekdayFormatter = new Intl.DateTimeFormat(intl, {
        weekday: 'short',
      })

      return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(monday)
        day.setDate(monday.getDate() + i)
        return {
          dateNum: day.getDate(),
          dayName: weekdayFormatter.format(day).replace('.', '').toUpperCase(),
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
     * Toggles between 'pt' and 'en' locales and syncs vue-i18n.
     */
    function toggleLocale() {
      locale.value = locale.value === 'pt' ? 'en' : 'pt'
      i18n.global.locale.value = locale.value
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

    /**
     * Selects a specific date and opens the day view.
     * @param {Date} date
     */
    function selectDate(date) {
      selectedDate.value = new Date(date)
      setActiveView('day')
    }

    return {
      theme,
      locale,
      activeView,
      currentDate,
      selectedDate,
      transitionDirection,
      contextLabel,
      weekDaysData,
      setTheme,
      toggleTheme,
      toggleLocale,
      initTheme,
      setActiveView,
      nextWeek,
      selectDate,
    }
  },
  {
    persist: {
      key: 'wnxt-ui',
      pick: ['theme', 'locale', 'activeView'],
    },
  }
)
