import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
// import router from './router' // Será ativado pelo Aider

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)
// app.use(router)

// A inicialização assíncrona com o Supabase (para evitar FOUC) 
// será implementada aqui pelo Aider conforme o AI_CONTEXT.md
app.mount('#app')