import { createI18n } from 'vue-i18n'
import en from './i18n/locales/en'
import pt from './i18n/locales/pt'

const messages = {
  en,
  pt,
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'pt',
  fallbackLocale: 'en',
  messages,
})

export default i18n
