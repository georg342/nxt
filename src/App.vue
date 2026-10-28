<script setup>
import { onMounted } from 'vue'
import { PhShieldCheck } from '@phosphor-icons/vue'
import AuthModal from './components/auth/AuthModal.vue'
import CreateEventModal from './components/events/CreateEventModal.vue'
import ToastNotification from './components/ui/ToastNotification.vue'
import AdminPanel from './components/admin/AdminPanel.vue'
import { useAuthStore } from './stores/authStore'
import { useUIStore } from './stores/uiStore'

const authStore = useAuthStore()
const uiStore = useUIStore()

onMounted(() => {
  authStore.initAuth()
})
</script>

<template>
  <router-view />

  <button
    v-if="authStore.isAdmin"
    type="button"
    class="admin-fab"
    aria-label="Admin panel"
    @click="uiStore.toggleAdminPanel()"
  >
    <PhShieldCheck :size="20" weight="duotone" />
  </button>

  <Transition name="admin-panel">
    <div v-if="uiStore.isAdminPanelOpen" class="admin-overlay">
      <div class="admin-overlay__inner">
        <button
          type="button"
          class="admin-overlay__close"
          aria-label="Close admin panel"
          @click="uiStore.closeAdminPanel()"
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
.admin-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 50;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--accent-color, #fb923c);
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md, 16px);
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
