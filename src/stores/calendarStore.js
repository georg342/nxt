import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useThemeStore } from './themeStore'
import { getWeekStart, toDateKey } from '../utils/date'

const VALID_VIEWS = ['year', 'month', 'week', 'day']
// Boot straight into today's day view, mirroring goToToday().
const DEFAULT_VIEW = 'day'

const VIEW_DEPTH = {
  year: 1,
  month: 2,
  week: 3,
  day: 4,
}

const DEFAULT_TRANSITION = 'ios-push'

const LOCALE_MAP = {
  pt: 'pt-BR',
  en: 'en-US',
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

export const useCalendarStore = defineStore('calendar', () => {
  const themeStore = useThemeStore()

  const activeView = ref(DEFAULT_VIEW)
  const currentDate = ref(new Date())
  const selectedDate = ref(new Date())
  const transitionDirection = ref(DEFAULT_TRANSITION)

  const intlLocale = computed(() => LOCALE_MAP[themeStore.locale] ?? 'en-US')

  /**
   * Formats an event date as a full localized string (e.g., "Saturday, October 31, 2026").
   * Locked to America/Sao_Paulo timezone.
   * @param {string} isoDate
   * @returns {string}
   */
  function formatEventDate(isoDate) {
    if (!isoDate) return ''
    const date = new Date(`${isoDate}T12:00:00`)
    const formatted = new Intl.DateTimeFormat(intlLocale.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(date)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  /**
   * Formats a `YYYY-MM-DD` key as day + month (e.g., "11 de novembro").
   * Built in local time to avoid the UTC shift of `new Date(isoDate)`.
   * @param {string} isoDate
   * @returns {string}
   */
  function formatDayMonth(isoDate) {
    if (!isoDate) return ''
    const [year, month, day] = String(isoDate).slice(0, 10).split('-').map(Number)
    const date = new Date(year, month - 1, day)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat(intlLocale.value, {
      day: 'numeric',
      month: 'long',
    }).format(date)
  }

  const isTodaySelected = computed(() => {
    if (activeView.value !== 'day') return false
    const target = selectedDate.value ?? currentDate.value
    const today = new Date()
    return (
      target.getFullYear() === today.getFullYear() &&
      target.getMonth() === today.getMonth() &&
      target.getDate() === today.getDate()
    )
  })

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
      const weekStart = getWeekStart(date)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const sameMonth = weekStart.getMonth() === weekEnd.getMonth()
      const startLabel = sameMonth
        ? formatShortDate(weekStart, intl).split(' ')[1]
        : formatShortDate(weekStart, intl)
      const endLabel = formatShortDate(weekEnd, intl)

      return sameMonth
        ? `${formatShortDate(weekStart, intl).split(' ')[0]} ${startLabel} - ${endLabel}`
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
    const weekStart = getWeekStart(currentDate.value)
    const intl = intlLocale.value
    const weekdayFormatter = new Intl.DateTimeFormat(intl, {
      weekday: 'short',
    })

    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      return {
        dateKey: toDateKey(day),
        dateNum: day.getDate(),
        dayName: weekdayFormatter.format(day).replace('.', '').toUpperCase(),
      }
    })
  })

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
   * Moves back to the previous week without leaving the week view.
   */
  function prevWeek() {
    const prev = new Date(currentDate.value)
    prev.setDate(prev.getDate() - 7)
    currentDate.value = prev
  }

  /**
   * Shifts the reference date by `delta` periods of the active view,
   * staying in the same view. Day view moves `selectedDate` as well,
   * since that is what the day feed renders.
   * @param {number} delta
   */
  function stepDate(delta) {
    const isDay = activeView.value === 'day'
    const next = new Date(
      isDay ? selectedDate.value ?? currentDate.value : currentDate.value
    )

    if (activeView.value === 'year') {
      next.setFullYear(next.getFullYear() + delta)
    } else if (activeView.value === 'month') {
      next.setMonth(next.getMonth() + delta)
    } else {
      next.setDate(next.getDate() + delta * (isDay ? 1 : 7))
    }

    currentDate.value = next
    if (isDay) selectedDate.value = new Date(next)
  }

  /**
   * Moves to the previous period of the active view.
   */
  function navigatePrev() {
    stepDate(-1)
  }

  /**
   * Moves to the next period of the active view.
   */
  function navigateNext() {
    stepDate(1)
  }

  /**
   * Navigates back one level in the view hierarchy.
   * day -> week, week -> month, month -> year, year -> -1 year.
   * When leaving the day view, keeps the currentDate anchored to the
   * selected day so the parent view (week/month) shows the correct period.
   */
  function goToPrevious() {
    if (activeView.value === 'day') {
      if (selectedDate.value) {
        currentDate.value = new Date(selectedDate.value)
      }
      setActiveView('week')
      return
    }

    if (activeView.value === 'week') {
      setActiveView('month')
      return
    }

    if (activeView.value === 'month') {
      setActiveView('year')
      return
    }

    const next = new Date(currentDate.value)
    next.setFullYear(next.getFullYear() - 1)
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

  /**
   * Opens the month view for the given month of the currently displayed year.
   * @param {number} monthIndex 0-11
   */
  function goToMonth(monthIndex) {
    const next = new Date(currentDate.value)
    // setDate first so short months don't overflow (e.g. Feb 31).
    next.setDate(1)
    next.setMonth(monthIndex)
    currentDate.value = next
    setActiveView('month')
  }

  /**
   * Opens the day view for today's date.
   */
  function goToToday() {
    const today = new Date()
    currentDate.value = today
    selectDate(today)
  }

  /**
   * Opens the week view for the week containing today.
   */
  function goToCurrentWeek() {
    currentDate.value = new Date()
    setActiveView('week')
  }

  return {
    activeView,
    currentDate,
    selectedDate,
    transitionDirection,
    contextLabel,
    weekDaysData,
    isTodaySelected,
    formatEventDate,
    formatDayMonth,
    setActiveView,
    nextWeek,
    prevWeek,
    stepDate,
    navigatePrev,
    navigateNext,
    goToPrevious,
    selectDate,
    goToMonth,
    goToToday,
    goToCurrentWeek,
  }
})
