<script setup>
import { onMounted, ref } from 'vue'
import { PhShieldCheck } from '@phosphor-icons/vue'
import AuthModal from './components/auth/AuthModal.vue'
import CreateEventModal from './components/events/CreateEventModal.vue'
import ToastNotification from './components/ui/ToastNotification.vue'
import AdminGateway from './components/admin/AdminGateway.vue'
import AppGate from './components/layout/AppGate.vue'
import { useAuthStore } from './stores/authStore'
import { useUIStore } from './stores/uiStore'

const GATE_STORAGE_KEY = 'wnxt_gate_unlocked'

const authStore = useAuthStore()
const uiStore = useUIStore()

const isUnlocked = ref(false)

function readGateState() {
  try {
    return sessionStorage.getItem(GATE_STORAGE_KEY) === '1'
  } catch (err) {
    return false
  }
}

function handleUnlock() {
  isUnlocked.value = true
}

onMounted(() => {
  isUnlocked.value = readGateState()
  authStore.initAuth()
})
</script>

<template>
  <AppGate v-if="!isUnlocked" @unlock="handleUnlock" />

  <template v-else>
    <router-view />

    <button
      v-if="authStore.isAdmin"
    type="button"
      class="admin-fab actionBtnWhiteText"
      aria-label="Admin panel"
      @click="uiStore.toggleAdminPanel()"
    >
      <PhShieldCheck :size="20" weight="duotone" />
    </button>

    <Transition name="admin-panel">
      <AdminGateway v-if="uiStore.isAdminPanelOpen" />
    </Transition>

    <AuthModal />
    <CreateEventModal />
    <ToastNotification />
  </template>
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

.admin-panel-enter-active,
.admin-panel-leave-active {
  transition: opacity 0.25s ease;
}

.admin-panel-enter-from,
.admin-panel-leave-to {
  opacity: 0;
}
</style>
