<script setup>
import { useUIStore } from '../../stores/uiStore'

const uiStore = useUIStore()

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAYS_IN_MONTH = 30

const days = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1)

function handleDayClick() {
  uiStore.setActiveView('week')
}
</script>

<template>
  <div class="month-grid">
    <div class="month-grid__weekdays">
      <span
        v-for="(day, index) in WEEKDAYS"
        :key="`${day}-${index}`"
        class="month-grid__weekday"
      >
        {{ day }}
      </span>
    </div>

    <div class="month-grid__days">
      <button
        v-for="day in days"
        :key="day"
        type="button"
        class="month-grid__day"
        :aria-label="`Day ${day}`"
        @click="handleDayClick"
      >
        {{ day }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.month-grid {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 8px;
  box-sizing: border-box;
}

.month-grid__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.month-grid__weekday {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.month-grid__days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
  gap: 0;
  min-height: 0;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-grid);
  overflow: hidden;
}

.month-grid__day {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--surface-color);
  color: var(--text-color);
  border: none;
  border-right: var(--border-width) solid var(--border-color);
  border-bottom: var(--border-width) solid var(--border-color);
  border-radius: 0;
  font-weight: 700;
  font-size: 0.875rem;
  min-height: 0;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.month-grid__day:nth-child(7n) {
  border-right: none;
}

.month-grid__day:nth-last-child(-n + 7) {
  border-bottom: none;
}

.month-grid__day:hover,
.month-grid__day:active {
  background-color: var(--accent-color);
  color: var(--accent-contrast);
}
</style>
