import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useUIStore } from './stores/uiStore'
import { useAuthStore } from './stores/authStore'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(MotionPlugin)

// Apply persisted theme to <html> before mounting to avoid theme flash.
useUIStore().initTheme()

/**
 * Resolves the Supabase session (and validates admin status) BEFORE mounting,
 * preventing Flash of Unauthenticated Content (FOUC) and guaranteeing that
 * `authStore.isAdmin` is already correct on the very first render.
 */
async function bootstrap() {
  const authStore = useAuthStore()

  try {
    await authStore.initAuth()
  } catch (err) {
    // Fail-open for boot: the UI still mounts, but `isAdmin` stays false
    // (fail-closed) so the admin route/panel remains inaccessible.
    console.error('[main] authStore.initAuth failed:', err)
  }

  // Ensure the initial route (and its beforeEach guard) has resolved before
  // the first render — avoids a flash of an unauthorized view on direct
  // navigation to protected routes such as `/admin`.
  await router.isReady()

  app.mount('#app')
}

bootstrap()
