<script setup>
import { onMounted } from 'vue'
import AuthModal from './components/auth/AuthModal.vue'
import CreateEventModal from './components/events/CreateEventModal.vue'
import ToastNotification from './components/ui/ToastNotification.vue'
import { useAuthStore } from './stores/authStore'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initAuth()
})
</script>

<template>
  <router-view />
  <AuthModal />
  <CreateEventModal />
  <ToastNotification />
</template>

<style>
/* O CSS global neo-brutalista será importado posteriormente */
</style>
