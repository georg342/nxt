<script setup>
import { PhX, PhCheckCircle, PhWarningCircle } from '@phosphor-icons/vue'
import { useUIStore } from '../../stores/uiStore'

const uiStore = useUIStore()
</script>

<template>
  <Transition name="toast">
    <div
      v-if="uiStore.toast.show"
      class="toast"
      :class="`toast--${uiStore.toast.type}`"
      role="status"
      aria-live="polite"
    >
      <PhCheckCircle
        v-if="uiStore.toast.type === 'success'"
        class="toast__icon"
        :size="22"
        weight="bold"
      />
      <PhWarningCircle
        v-else-if="uiStore.toast.type === 'error'"
        class="toast__icon"
        :size="22"
        weight="bold"
      />
      <span class="toast__message">{{ uiStore.toast.message }}</span>
      <button
        type="button"
        class="toast__close"
        aria-label="Close"
        @click="uiStore.hideToast()"
      >
        <PhX :size="16" weight="bold" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: 96px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: fit-content;
  max-width: 85vw;
  white-space: nowrap;
  padding: 12px 16px;
  background: var(--accent-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
  color: var(--text-color);
  font-size: 0.875rem;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.toast--success {
  background: #a3e635;
  color: #000000;
}

.toast--error {
  background: #fb923c;
  color: #000000;
}

.toast--info {
  background: var(--surface-color);
}

.toast__icon {
  flex-shrink: 0;
  color: #000000;
}

.toast__message {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow-wrap: break-word;
  word-break: break-word;
}

.toast__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: 2px solid currentColor;
  border-radius: var(--radius-md);
  color: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
</style>
