import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    nav: {
      year: '12M',
      month: '30D',
      week: '7D',
      today: 'Today',
      add: '+',
      previous: 'Previous',
    },
    next: 'NEXT',
    nav: {
      year: '12M',
      month: '30D',
      week: '7D',
      today: 'Today',
      add: '+',
      previous: 'Previous',
    },
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
      previous: 'Anterior',
    },
    next: 'PROX',
    nav: {
      year: '12M',
      month: '30D',
      week: '7D',
      today: 'Hoje',
      add: '+',
      previous: 'Anterior',
    },
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
