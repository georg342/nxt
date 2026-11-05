import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import i18n from '../i18n'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/admin',
    name: 'admin-gateway',
    component: () => import('../views/AdminGatewayView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// UX-only gate; the real authorization is Postgres RLS on admin_users.
router.beforeEach(async (to) => {
  if (!to.path.startsWith('/admin')) return true

  const authStore = useAuthStore()
  if (!authStore.isAdmin) return { path: '/' }

  const isAdmin = await authStore.checkIsAdmin()
  if (!isAdmin) {
    useUIStore().showToast(
      i18n.global.t('admin.auth.unauthorized'),
      'error'
    )
    return { path: '/' }
  }

  return true
})

export default router
