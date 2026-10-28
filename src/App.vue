<script setup>
import { onMounted, ref } from 'vue'
import { PhShieldCheck } from '@phosphor-icons/vue'
import AuthModal from './components/auth/AuthModal.vue'
import CreateEventModal from './components/events/CreateEventModal.vue'
import ToastNotification from './components/ui/ToastNotification.vue'
import AdminPanel from './components/admin/AdminPanel.vue'
import { useAuthStore } from './stores/authStore'

const authStore = useAuthStore()
const isAdminPanelOpen = ref(false)

onMounted(() => {
  authStore.initAuth()
})
</script>

<template>
  <router-view />

  <button
    v-if="authStore.isAdmin"
    type="button"
    class="admin-toggle"
    aria-label="Admin panel"
    @click="isAdminPanelOpen = !isAdminPanelOpen"
  >
    <PhShieldCheck :size="20" weight="duotone" />
  </button>

  <Transition name="admin-panel">
    <div v-if="isAdminPanelOpen" class="admin-overlay">
      <div class="admin-overlay__inner">
        <button
          type="button"
          class="admin-overlay__close"
          aria-label="Close admin panel"
          @click="isAdminPanelOpen = false"
        >
          Fechar
        </button>
        <AdminPanel />
      </div>
    </div>
  </Transition>

  <AuthModal />
  <CreateEventModal />
  <ToastNotification />
</template>

<style>
/* O CSS global neo-brutalista será importado posteriormente */
.admin-toggle {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--accent-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
  color: var(--text-color);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.admin-overlay {
  position: fixed;
  inset: 0;
  z-index: 9500;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overflow-y: auto;
}

.admin-overlay__inner {
  position: relative;
  max-width: 640px;
  margin: 5vh auto;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
}

.admin-overlay__close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  padding: 6px 10px;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-color);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.admin-panel-enter-active,
.admin-panel-leave-active {
  transition: opacity 0.25s ease;
}

.admin-panel-enter-from,
.admin-panel-leave-to {
  opacity: 0;
}
</style>
