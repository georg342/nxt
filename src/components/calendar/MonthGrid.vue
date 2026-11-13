<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCalendarStore } from '../../stores/calendarStore'
import { useEventStore } from '../../stores/eventStore'
import { toDateKey } from '../../utils/date'

const { t, locale } = useI18n()
const calendarStore = useCalendarStore()
const eventStore = useEventStore()

const transitionDirection = ref('next')

const monthKey = computed(() => {
  const base = calendarStore.currentDate ?? new Date()
  return `${base.getFullYear()}-${base.getMonth()}`
})

// Navigation is triggered outside this component, so derive the direction
// from the month delta instead of a local handler.
watch(
  () => {
    const base = calendarStore.currentDate ?? new Date()
    return base.getFullYear() * 12 + base.getMonth()
  },
  (next, prev) => {
    transitionDirection.value = next > prev ? 'next' : 'prev'
  }
)

// Localized weekday initials, Sunday first (2023-01-01 was a Sunday).
const WEEKDAYS = computed(() => {
  const fmt = new Intl.DateTimeFormat(locale.value, { weekday: 'short' })
  return Array.from({ length: 7 }, (_, index) =>
    fmt.format(new Date(2023, 0, 1 + index)).replace(/\.$/, '')
  )
})
// Counts approved events per day of the displayed month.
const eventCountsByDay = computed(() => {
  const base = calendarStore.currentDate ?? new Date()
  const monthPrefix = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-`
  const counts = new Map()

  for (const event of eventStore.events) {
    const key = String(event.start_date ?? '').slice(0, 10)
    if (!key.startsWith(monthPrefix)) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return counts
})

onMounted(() => {
  if (eventStore.events.length === 0) eventStore.loadEvents()
})

const days = computed(() => {
  const base = calendarStore.currentDate ?? new Date()
  const year = base.getFullYear()
  const month = base.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  // Day numbers <= 0 or past the month roll into the adjacent months.
  for (let offset = firstDay; offset > 0; offset -= 1) {
    const date = new Date(year, month, 1 - offset)
    cells.push({ value: date.getDate(), date, isOutsideMonth: true })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      value: day,
      date: new Date(year, month, day),
      isOutsideMonth: false,
    })
  }
  let nextDay = 1
  while (cells.length % 7 !== 0) {
    cells.push({
      value: nextDay,
      date: new Date(year, month + 1, nextDay),
      isOutsideMonth: true,
    })
    nextDay += 1
  }
  return cells.map((cell) => ({
    ...cell,
    // Drives the badge and the raised style for days with approved events.
    eventCount: eventCountsByDay.value.get(toDateKey(cell.date)) ?? 0,
  }))
})

function ariaLabelFor(cell) {
  const date = cell.date
  const iso = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
  const label = calendarStore.formatEventDate(iso)
  if (!cell.eventCount) return label
  return `${label}, ${t('calendar.eventCount', cell.eventCount, { count: cell.eventCount })}`
}

function handleDayClick(cell) {
  calendarStore.selectDate(cell.date)
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

    <div class="month-grid__track">
      <Transition :name="`slide-${transitionDirection}`">
        <div
          :key="monthKey"
          class="month-grid__days"
        >
          <template
            v-for="(cell, index) in days"
            :key="index"
          >
            <button
              type="button"
              class="month-grid__day"
              :class="{
                'is-outside-month': cell.isOutsideMonth,
                'has-events': cell.eventCount > 0,
              }"
              :aria-label="ariaLabelFor(cell)"
              @click="handleDayClick(cell)"
            >
              <span class="month-grid__day-number">{{ cell.value }}</span>
              <span
                v-if="cell.eventCount > 0"
                class="month-grid__badge"
                aria-hidden="true"
              >
                {{ cell.eventCount }}
              </span>
            </button>
          </template>
        </div>
      </Transition>
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

.month-grid__track {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.month-grid__days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  height: 100%;
  align-content: start;
  background-color: var(--bg-color);
}

.month-grid__day {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  padding: 0;
  background-color: var(--surface-color);
  color: var(--text-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-weight: 900;
  font-size: 0.875rem;
  min-height: 0;
}

/* Raised cell: this day has approved events. Matches the folder-card lift. */
.month-grid__day.has-events {
  box-shadow: 2px 2px 0 0 var(--shadow-color);
}

.month-grid__badge {
  position: absolute;
  top: 2px;
  right: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  background-color: var(--accent-color);
  color: var(--accent-contrast);
  border: 2px solid var(--border-color);
  border-radius: 999px;
  font-size: 0.625rem;
  font-weight: 900;
  line-height: 1;
  box-sizing: border-box;
}

.month-grid__day {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.month-grid__day:hover,
.month-grid__day:active {
  background-color: var(--accent-color);
  color: var(--accent-contrast);
  transform: translate(-2px, -2px);
  box-shadow: 2px 2px 0 0 var(--border-color);
}

.month-grid__day.is-outside-month {
  opacity: 0.4;
  border-color: var(--text-muted);
  box-shadow: none;
}

.month-grid__day.is-outside-month:hover,
.month-grid__day.is-outside-month:active {
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-next-leave-active,
.slide-prev-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.slide-next-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-next-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-prev-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-prev-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
