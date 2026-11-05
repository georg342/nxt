import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { SupabaseEventRepository } from '../repositories/SupabaseEventRepository'

const MASTER_EMAIL = 'getoledo.123@gmail.com'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthModalOpen = ref(false)

  const isAdmin = computed(() => Boolean(user.value))
  const isSuperAdmin = computed(
    () => Boolean(user.value) && user.value.email === MASTER_EMAIL
  )

  async function initAuth() {
    const { data } = await supabase.auth.getSession()
    user.value = data?.session?.user ?? null

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
  }

  /**
   * Verifies the session email against admin_users (read-only; table is
   * managed manually in the Supabase dashboard).
   * @returns {Promise<boolean>}
   */
  async function checkIsAdmin() {
    const email = user.value?.email
    if (!email) return false

    const repository = new SupabaseEventRepository()
    return repository.isAdminEmail(email)
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
