import { createI18n } from 'vue-i18n'
import en from './locales/en'
import pt from './locales/pt'

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
