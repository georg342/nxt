<script setup>
import { PhX, PhGoogleLogo } from '@phosphor-icons/vue'
import BrutalButton from '../ui/BrutalButton.vue'
import { useAuthStore } from '../../stores/authStore'

const authStore = useAuthStore()
</script>

<template>
  <Transition name="auth-modal">
    <div
      v-if="authStore.isAuthModalOpen"
      class="auth-modal"
      role="dialog"
      aria-modal="true"
      @click.self="authStore.closeAuthModal()"
    >
      <div class="auth-modal__card">
        <button
          type="button"
          class="auth-modal__close"
          aria-label="Close"
          @click="authStore.closeAuthModal()"
        >
          <PhX :size="20" weight="bold" />
        </button>

        <h2 class="auth-modal__title">{{ $t('auth.title') }}</h2>
        <p class="auth-modal__text">{{ $t('auth.description') }}</p>

        <BrutalButton
          class="auth-modal__google"
          color="var(--accent-color)"
          @click="authStore.loginWithGoogle()"
        >
          <PhGoogleLogo :size="20" weight="bold" />
          {{ $t('auth.signInWithGoogle') }}
        </BrutalButton>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.auth-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.auth-modal__card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  max-width: 360px;
  padding: var(--space-5);
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
}

.auth-modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-color);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.auth-modal__title {
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.auth-modal__text {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-muted);
}

.auth-modal__google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
}

.auth-modal-enter-active,
.auth-modal-leave-active {
  transition: opacity 0.25s ease;
}

.auth-modal-enter-from,
.auth-modal-leave-to {
  opacity: 0;
}
</style>
