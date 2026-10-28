import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import i18n from '../i18n'

const THEME_LIGHT = 'light'
const THEME_DARK = 'dark'
const DEFAULT_THEME = THEME_LIGHT

const VALID_VIEWS = ['year', 'month', 'week', 'day']
const DEFAULT_VIEW = 'year'

const MIN_SEARCH_LENGTH = 3

const MOCK_EVENTS = [
  {
    id: 1,
    title: 'Neon Warehouse',
    date: '2026-10-31',
    time: '22:00',
    location: 'Vila Madalena, SP',
    genres: ['Techno', 'Deep House', 'Breaks'],
    lineup: ['DJ Vertex', 'Luna Flux', 'Kairo'],
  },
  {
    id: 2,
    title: 'Basement Sessions',
    date: '2026-11-07',
    time: '23:30',
    location: 'Centro, SP',
    genres: ['Minimal Techno', 'Deep House', 'Ambient'],
    lineup: ['Sublevel', 'Mara Vex'],
  },
  {
    id: 3,
    title: 'Sunrise Rooftop',
    date: '2026-11-15',
    time: '05:00',
    location: 'Pinheiros, SP',
    genres: ['Melodic Techno', 'Progressive House', 'Downtempo'],
    lineup: ['Aurora', 'Nyx'],
  },
  {
    id: 4,
    title: 'Forest Ritual',
    date: '2026-11-21',
    time: '23:00',
    location: 'Juquitiba, SP',
    genres: ['Psytrance', 'Full On', 'Forest', 'Ambient'],
    lineup: ['Shakti', 'Mandala', 'Yggdrasil', 'Terra Viva', 'Nebula'],
  },
  {
    id: 5,
    title: 'Bassline Bunker',
    date: '2026-11-28',
    time: '23:59',
    location: 'Barra Funda, SP',
    genres: ['Drum & Bass', 'Neurofunk', 'Jungle', 'Breaks'],
    lineup: ['Subsonic', 'Raven', 'Kortex'],
  },
  {
    id: 6,
    title: 'Hard Asylum',
    date: '2026-12-05',
    time: '22:30',
    location: 'Santo André, SP',
    genres: ['Hardstyle', 'Rawstyle', 'Uptempo', 'Hard Techno'],
    lineup: ['Overdrive', 'Khaos', 'Vandal', 'Riot', 'Fúria', 'Titan'],
  },
  {
    id: 7,
    title: 'Disco Fever',
    date: '2026-12-12',
    time: '21:00',
    location: 'Bela Vista, SP',
    genres: ['Nu Disco', 'Italo Disco', 'Funk', 'House'],
    lineup: ['Groove Machine'],
  },
  {
    id: 8,
    title: 'Ambient Drift',
    date: '2026-12-19',
    time: '18:00',
    location: 'Ibirapuera, SP',
    genres: ['Ambient', 'Downtempo', 'IDM', 'Experimental'],
    lineup: ['Aether', 'Solstice'],
  },
  {
    id: 9,
    title: 'Big Room Blast',
    date: '2026-12-31',
    time: '23:00',
    location: 'Anhembi, SP',
    genres: ['EDM', 'Big Room', 'Electro House', 'Future Bass'],
    lineup: ['Pulse', 'Nova', 'Zephyr', 'Blaze', 'Echo', 'Titan', 'Vortex', 'Halo'],
  },
  {
    id: 10,
    title: 'Breaks & Beats',
    date: '2027-01-09',
    time: '22:00',
    location: 'Pinheiros, SP',
    genres: ['Breaks', 'Breakbeat', 'Big Beat', 'Electro'],
    lineup: ['Fractal', 'Rhythm Kid', 'Loopmaster'],
  },
  {
    id: 11,
    title: 'Trance Odyssey',
    date: '2027-01-16',
    time: '23:30',
    location: 'Moema, SP',
    genres: ['Uplifting Trance', 'Progressive Trance', 'Vocal Trance', 'Psytrance'],
    lineup: ['Celestia', 'Aurora', 'Nyx', 'Starlight', 'Orion'],
  },
  {
    id: 12,
    title: 'Tech House Lab',
    date: '2027-01-23',
    time: '22:00',
    location: 'Itaim Bibi, SP',
    genres: ['Tech House', 'Minimal House', 'Deep House', 'Minimal Techno'],
    lineup: ['Groove Lab', 'Bassline', 'Deepcut'],
  },
  {
    id: 13,
    title: 'Dubstep Arena',
    date: '2027-01-30',
    time: '23:00',
    location: 'Lapa, SP',
    genres: ['Dubstep', 'Riddim', 'Trap', 'Drum & Bass'],
    lineup: ['Wobble', 'Grim', 'Bassdrop', 'Havoc'],
  },
]

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
    const searchQuery = ref('')
    const isSearchOpen = ref(false)
    const isCreateEventModalOpen = ref(false)

    const intlLocale = computed(() => LOCALE_MAP[locale.value] ?? 'en-US')

    const normalizedSearchQuery = computed(() =>
      searchQuery.value.trim().toLowerCase()
    )

    const hasSearchQuery = computed(
      () => normalizedSearchQuery.value.length > 0
    )

    const hasMinSearchLength = computed(
      () => normalizedSearchQuery.value.length >= MIN_SEARCH_LENGTH
    )

    const searchResults = computed(() => {
      if (!hasSearchQuery.value) return MOCK_EVENTS
      if (!hasMinSearchLength.value) return []
      const q = normalizedSearchQuery.value

      return MOCK_EVENTS.filter((event) => {
        const haystack = [
          event.title,
          event.date,
          event.time,
          event.location,
          ...event.genres,
          ...event.lineup,
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
    })

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

    /**
     * Opens the search field.
     */
    function openSearch() {
      isSearchOpen.value = true
    }

    /**
     * Closes the search field and clears the query.
     */
    function closeSearch() {
      isSearchOpen.value = false
      searchQuery.value = ''
    }

    /**
     * Toggles the search field visibility.
     */
    function toggleSearch() {
      if (isSearchOpen.value) {
        closeSearch()
      } else {
        openSearch()
      }
    }

    /**
     * Opens the create event modal.
     */
    function openCreateEventModal() {
      isCreateEventModalOpen.value = true
    }

    /**
     * Closes the create event modal.
     */
    function closeCreateEventModal() {
      isCreateEventModalOpen.value = false
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
      isTodaySelected,
      hasSearchQuery,
      hasMinSearchLength,
      searchResults,
      formatEventDate,
      setTheme,
      toggleTheme,
      toggleLocale,
      initTheme,
      searchQuery,
      isSearchOpen,
      isCreateEventModalOpen,
      setActiveView,
      nextWeek,
      goToPrevious,
      selectDate,
      goToToday,
      goToCurrentWeek,
      openSearch,
      closeSearch,
      toggleSearch,
      openCreateEventModal,
      closeCreateEventModal,
    }
  },
  {
    persist: {
      key: 'wnxt-ui',
      pick: ['theme', 'locale', 'activeView'],
    },
  }
)
