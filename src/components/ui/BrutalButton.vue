<script setup>
import { computed } from 'vue'

const props = defineProps({
  color: {
    type: String,
    default: 'var(--surface-color)',
  },
  type: {
    type: String,
    default: 'button',
  },
})

const buttonStyle = computed(() => ({
  backgroundColor: props.color,
}))
</script>

<template>
  <button
    :type="type"
    class="brutal-button"
    :style="buttonStyle"
  >
    <slot />
  </button>
</template>

<style scoped>
.brutal-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--hit-area-min);
  min-width: var(--hit-area-min);
  padding: var(--space-2) var(--space-4);
  color: var(--text-color);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-button);
  box-shadow: var(--shadow-1);
  font-weight: 700;
  font-size: 0.875rem;
  line-height: 1;
  cursor: pointer;
  transition: transform var(--transition-fast),
    box-shadow var(--transition-fast);
}

.brutal-button:hover,
.brutal-button:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px var(--shadow-color);
}

.brutal-button:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}
</style>
