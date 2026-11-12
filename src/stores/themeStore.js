import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import i18n from '../i18n'

const THEME_LIGHT = 'light'
const THEME_DARK = 'dark'
const DEFAULT_THEME = THEME_LIGHT

const DEFAULT_LOCALE = 'pt'

/**
 * Selectable primary accent colors.
 * `contrast` is the text/icon color to use on top of `color`.
 * @typedef {Object} AccentPreset
 * @property {string} id
 * @property {string} label
 * @property {string} color
 * @property {string} contrast
 */

/** @type {AccentPreset[]} */
const ACCENT_PRESETS = [
  { id: 'yellow', label: 'Amarelo', color: '#FACC15', contrast: '#111111' },
  { id: 'orange', label: 'Laranja', color: '#FB923C', contrast: '#111111' },
  { id: 'pink', label: 'Rosa', color: '#F472B6', contrast: '#111111' },
  { id: 'lime', label: 'Lima', color: '#A3E635', contrast: '#111111' },
  { id: 'cyan', label: 'Ciano', color: '#22D3EE', contrast: '#111111' },
  { id: 'violet', label: 'Violeta', color: '#A78BFA', contrast: '#111111' },
]

const DEFAULT_ACCENT = 'yellow'

/**
 * Resolves an accent preset by id, falling back to the default accent.
 * @param {string} presetId
 * @returns {AccentPreset}
 */
function getAccentPreset(presetId) {
  return (
    ACCENT_PRESETS.find((preset) => preset.id === presetId) ??
    ACCENT_PRESETS.find((preset) => preset.id === DEFAULT_ACCENT)
  )
}

/**
 * Applies the accent preset to the <html> element as inline CSS variables.
 * Inline values win over the `[data-theme]` declarations, so the user's
 * choice stays consistent across light/dark theme switches.
 * @param {AccentPreset} preset
 */
function applyAccentToDocument(preset) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--accent-color', preset.color)
  root.style.setProperty('--accent-contrast', preset.contrast)
}

/**
 * Applies the given theme to the <html> element via the data-theme attribute.
 * @param {'light' | 'dark'} theme
 */
function applyThemeToDocument(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

export const useThemeStore = defineStore(
  'theme',
  () => {
    const theme = ref(DEFAULT_THEME)
    const locale = ref(DEFAULT_LOCALE)
    const accentPreset = ref(DEFAULT_ACCENT)
    const accentPresets = ref(ACCENT_PRESETS)

    const accentColor = computed(() => getAccentPreset(accentPreset.value).color)

    const accentContrast = computed(
      () => getAccentPreset(accentPreset.value).contrast
    )

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
     * Sets the primary accent color preset and applies it to the document.
     * @param {string} presetId
     */
    function setAccentColor(presetId) {
      const preset = getAccentPreset(presetId)
      accentPreset.value = preset.id
      applyAccentToDocument(preset)
    }

    /**
     * Ensures the persisted accent color is applied to the document.
     * Useful on app bootstrap after persisted state hydration.
     */
    function initAccentColor() {
      applyAccentToDocument(getAccentPreset(accentPreset.value))
    }

    /**
     * Ensures the current theme (and accent color) is applied to the document.
     * Useful on app bootstrap after persisted state hydration.
     */
    function initTheme() {
      applyThemeToDocument(theme.value)
      initAccentColor()
    }

    return {
      theme,
      locale,
      accentPreset,
      accentPresets,
      accentColor,
      accentContrast,
      setTheme,
      toggleTheme,
      toggleLocale,
      setAccentColor,
      initAccentColor,
      initTheme,
    }
  },
  {
    persist: {
      key: 'wnxt-ui',
      pick: ['theme', 'locale', 'accentPreset'],
    },
  }
)
