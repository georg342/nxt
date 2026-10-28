<script setup>
import { onMounted } from 'vue'
import AuthModal from './components/auth/AuthModal.vue'
import { useAuthStore } from './stores/authStore'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initAuth()
})
</script>

<template>
  <router-view />
  <AuthModal />
</template>

<style>
/* O CSS global neo-brutalista será importado posteriormente */
</style>
