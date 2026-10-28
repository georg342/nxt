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
    createEvent: {
      title: 'Send a suggestion',
      close: 'Close',
      submit: 'Create Event',
      submitting: 'Creating...',
      error: 'Failed to create event. Please try again.',
      success: 'Event sent successfully!',
      fields: {
        title: 'Title',
        startDate: 'Date & Time',
        location: 'Location',
        lineup: 'Lineup (comma-separated)',
        genres: 'Genres (comma-separated)',
      },
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
    createEvent: {
      title: 'ESugestão de Evento',
      close: 'Fechar',
      submit: 'Enviar',
      submitting: 'Enviando...',
      error: 'Falha ao enviar sugestão, tente novamente.',
      success: 'Sugestão enviada!',
      fields: {
        title: 'Nome do Evento',
        startDate: 'Data e Hora',
        location: 'Localização',
        lineup: 'Lineup (separado por vírgula)',
        genres: 'Gêneros (separado por vírgula)',
      },
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
