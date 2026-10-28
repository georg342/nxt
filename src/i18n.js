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
      viewOptions: 'View options',
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
    auth: {
      title: 'Welcome',
      description: 'Sign in to suggest and manage events.',
      signInWithGoogle: 'Sign in with Google',
      close: 'Close',
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
      viewOptions: 'Opções de visualização',
    },
    next: 'PROX',
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
    auth: {
      title: 'Bem-vindo',
      description: 'Faça login para sugerir e gerenciar festas.',
      signInWithGoogle: 'Entrar com Google',
      close: 'Fechar',
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
