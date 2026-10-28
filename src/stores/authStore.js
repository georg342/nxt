import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '../lib/supabase'

const MASTER_EMAIL = 'YOUR_EMAIL_HERE'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthModalOpen = ref(false)

  const isAdmin = computed(() => Boolean(user.value))
  const isSuperAdmin = computed(
    () => Boolean(user.value) && user.value.email === MASTER_EMAIL
  )

  function initAuth() {
    supabase.auth.getSession().then(({ data }) => {
      user.value = data?.session?.user ?? null
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
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
    loginWithGoogle,
    logout,
    openAuthModal,
    closeAuthModal,
  }
})
