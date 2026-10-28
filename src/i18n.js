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
    next: 'NEXT',
    locale: {
      toPt: 'PT',
      toEn: 'EN',
    },
    search: {
      open: 'Open search',
      close: 'Close search',
      placeholder: 'Search events...',
      hint: 'Type at least 3 characters to search.',
      empty: 'No events found.',
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
    next: 'PRÓX',
    locale: {
      toPt: 'PT',
      toEn: 'EN',
    },
    search: {
      open: 'Abrir busca',
      close: 'Fechar busca',
      placeholder: 'Buscar eventos...',
      hint: 'Digite ao menos 3 caracteres para buscar.',
      empty: 'Nenhum evento encontrado.',
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
