<script setup>
import { defineAsyncComponent } from 'vue'
import AuthModal from './components/auth/AuthModal.vue'
import CreateEventModal from './components/events/CreateEventModal.vue'
import ToastNotification from './components/ui/ToastNotification.vue'
// Admin-only panel: loaded on first open, keeps it out of the initial bundle.
const AdminGateway = defineAsyncComponent(
  () => import('./components/admin/AdminGateway.vue')
)
import { useUIStore } from './stores/uiStore'

const uiStore = useUIStore()
</script>

<template>
  <router-view />
  <Transition name="admin-panel">
    <AdminGateway v-if="uiStore.isAdminPanelOpen" />
  </Transition>

  <AuthModal />
  <CreateEventModal />
  <ToastNotification />
</template>

<style>
/* O CSS global neo-brutalista será importado posteriormente */

.admin-panel-enter-active,
.admin-panel-leave-active {
  transition: opacity 0.25s ease;
}

.admin-panel-enter-from,
.admin-panel-leave-to {
  opacity: 0;
}
</style>
