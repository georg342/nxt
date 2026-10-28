import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    nav: {
      year: '12M',
      month: '30D',
      week: '7D',
      today: 'Today',
      add: '+',
    },
    next: 'NEXT ->',
    theme: {
      toDark: '🌙',
      toLight: '☀️',
    },
    locale: {
      toPt: 'PT',
      toEn: 'EN',
    },
  },
  pt: {
    nav: {
      year: '12M',
      month: '30D',
      week: '7D',
      today: 'Hoje',
      add: '+',
    },
    next: 'PRÓX ->',
    theme: {
      toDark: '🌙',
      toLight: '☀️',
    },
    locale: {
      toPt: 'PT',
      toEn: 'EN',
    },
  },
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'pt',
  fallbackLocale: 'en',
  messages,
})

export default i18n
