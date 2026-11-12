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
    // No view: the guard below opens the panel and redirects to `/`.
    component: { render: () => null },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// UX-only gate; the real authorization is Postgres RLS on admin_users.
// `/admin` carries no view: it only opens the panel overlay, then lands on `/`.
router.beforeEach(async (to) => {
  if (to.path !== '/admin') return true

  const authStore = useAuthStore()
  if (!authStore.user) return { path: '/' }

  const isAdmin = await authStore.checkIsAdmin()
  if (!isAdmin) {
    useUIStore().showToast(
      i18n.global.t('admin.auth.unauthorized'),
      'error'
    )
    return { path: '/' }
  }

  useUIStore().openAdminPanel()
  return { path: '/' }
})

export default router
