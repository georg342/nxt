<script setup>
import { computed } from 'vue'
import { useUIStore } from '../../stores/uiStore'

const uiStore = useUIStore()

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const days = computed(() => {
  const base = uiStore.currentDate ?? new Date()
  const year = base.getFullYear()
  const month = base.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDay; i += 1) {
    cells.push({ type: 'empty', value: null, date: null })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ type: 'day', value: day, date: new Date(year, month, day) })
  }
  const totalCells = Math.ceil(cells.length / 7) * 7
  while (cells.length < totalCells) {
    cells.push({ type: 'empty', value: null, date: null })
  }
  return cells
})

function handleDayClick(cell) {
  if (!cell.date) return
  uiStore.selectDate(cell.date)
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
      <template
        v-for="(cell, index) in days"
        :key="index"
      >
        <button
          v-if="cell.type === 'day'"
          type="button"
          class="month-grid__day"
          :aria-label="`Day ${cell.value}`"
          @click="handleDayClick(cell)"
        >
          {{ cell.value }}
        </button>
        <div
          v-else
          class="month-grid__empty"
        />
      </template>
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
  gap: 4px;
  flex: 1;
  min-height: 0;
  align-content: start;
}

.month-grid__day,
.month-grid__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  background-color: var(--surface-color);
  color: var(--text-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-weight: 900;
  font-size: 0.875rem;
  min-height: 0;
}

.month-grid__day {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.month-grid__empty {
  background-color: transparent;
  border-color: transparent;
}

.month-grid__day:hover,
.month-grid__day:active {
  background-color: var(--accent-color);
  color: var(--accent-contrast);
  transform: translate(-2px, -2px);
  box-shadow: 2px 2px 0 0 var(--border-color);
}
</style>
