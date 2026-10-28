import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import router from './router'
import { useUIStore } from './stores/uiStore'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(MotionPlugin)

// Apply persisted theme to <html> before mounting to avoid theme flash.
useUIStore().initTheme()

// A inicialização assíncrona com o Supabase (para evitar FOUC)
// será implementada aqui pelo Aider conforme o AI_CONTEXT.md
app.mount('#app')
