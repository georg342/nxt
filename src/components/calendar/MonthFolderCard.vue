<script setup>
import { useUIStore } from '../../stores/uiStore'

defineProps({
  month: {
    type: String,
    required: true,
  },
  eventCount: {
    type: Number,
    default: 0,
  },
})

const uiStore = useUIStore()

function handleClick() {
  uiStore.setActiveView('month')
}
</script>

<template>
  <button
    type="button"
    class="month-folder"
    :aria-label="`${month}, ${eventCount} events`"
    @click="handleClick"
  >
    <span class="month-folder__tab">{{ month }}</span>
    <span class="month-folder__body">
      <span class="month-folder__count">{{ eventCount }}</span>
    </span>
  </button>
</template>

<style scoped>
.month-folder {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  height: 100%;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  filter: drop-shadow(4px 4px 0px var(--shadow-color));
  transition: transform var(--transition-fast),
    filter var(--transition-fast);
}

.month-folder:hover,
.month-folder:active {
  transform: translate(2px, 2px);
  filter: drop-shadow(2px 2px 0px var(--shadow-color));
}

.month-folder__tab {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  padding: 2px var(--space-2);
  background-color: var(--accent-color);
  color: var(--accent-contrast);
  border: var(--border-width) solid var(--border-color);
  border-bottom: none;
  border-top-left-radius: var(--radius-card);
  border-top-right-radius: var(--radius-card);
  font-weight: 900;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1.2;
  position: relative;
  z-index: 1;
}

.month-folder__body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--surface-color);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-card);
  border-top-left-radius: 0;
  margin-top: -2px;
  min-height: 0;
}

.month-folder__count {
  font-weight: 900;
  font-size: clamp(1.25rem, 5vw, 2rem);
  color: var(--text-color);
  line-height: 1;
}
</style>
