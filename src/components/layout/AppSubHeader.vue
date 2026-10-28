<script setup>
import { useUIStore } from '../../stores/uiStore'

const uiStore = useUIStore()
</script>

<template>
  <div class="app-subheader">
    <Transition name="fade-text" mode="out-in">
      <span
        :key="uiStore.contextLabel"
        class="app-subheader__label"
      >
        {{ uiStore.contextLabel }}
      </span>
    </Transition>
  </div>
</template>

<style scoped>
.app-subheader {
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  background-color: var(--surface-color);
  border-bottom: var(--border-width) solid var(--border-color);
  flex-shrink: 0;
  min-height: 36px;
}

.app-subheader__label {
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.02em;
  color: var(--text-color);
}
</style>
