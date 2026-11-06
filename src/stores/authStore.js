import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { SupabaseEventRepository } from '../repositories/SupabaseEventRepository'
import { useUIStore } from '../stores/uiStore'

const MASTER_EMAIL = 'getoledo.123@gmail.com'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthModalOpen = ref(false)
  // Resultado de admin_users para o usuário atual; nunca inferido do login.
  const isVerifiedAdmin = ref(false)

  const isAdmin = computed(() => Boolean(user.value) && isVerifiedAdmin.value)
  const isSuperAdmin = computed(
    () => Boolean(user.value) && user.value.email === MASTER_EMAIL
  )

  async function initAuth() {
    const { data } = await supabase.auth.getSession()
    user.value = data?.session?.user ?? null

    if (user.value) {
      await checkIsAdmin()
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
      // cache pertence ao usuário anterior; invalida e revalida sem bloquear
      isVerifiedAdmin.value = false
      if (user.value) {
        checkIsAdmin().catch((err) =>
          console.error('[authStore] revalidate admin failed:', err)
        )
      }
    })
  }

  /**
   * Verifies the session email against admin_users (read-only; table is
   * managed manually in the Supabase dashboard).
   * @returns {Promise<boolean>}
   */
  async function checkIsAdmin() {
    const email = user.value?.email
    if (!email) {
      isVerifiedAdmin.value = false
      return false
    }

    if (isVerifiedAdmin.value) return true

    const repository = new SupabaseEventRepository()
    isVerifiedAdmin.value = await repository.isAdminEmail(email)
    return isVerifiedAdmin.value
  }

  async function loginWithGoogle() {
    const redirectTo =
      typeof window !== 'undefined' ? window.location.origin : undefined

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })

    if (error) {
      console.error('[authStore] loginWithGoogle error:', error)
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('[authStore] logout error:', error)
    }

    isVerifiedAdmin.value = false
    useUIStore().closeAdminPanel()
  }

  function openAuthModal() {
    isAuthModalOpen.value = true
  }

  function closeAuthModal() {
    isAuthModalOpen.value = false
  }

  return {
    user,
    isAdmin,
    isVerifiedAdmin,
    isSuperAdmin,
    isAuthModalOpen,
    initAuth,
    checkIsAdmin,
    loginWithGoogle,
    logout,
    openAuthModal,
    closeAuthModal,
  }
})
