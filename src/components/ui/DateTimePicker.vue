<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue'

const props = defineProps({
  modelValue: {
    type: [String, Date],
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function parseInitial(value) {
  if (!value) return null
  const date = value instanceof Date ? new Date(value) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const initial = parseInitial(props.modelValue)

const currentDate = ref(
  initial ? new Date(initial.getFullYear(), initial.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
)
const selectedDate = ref(initial ? new Date(initial.getFullYear(), initial.getMonth(), initial.getDate()) : null)
const selectedHour = ref(initial ? initial.getHours() : 22)
const selectedMinute = ref(initial ? initial.getMinutes() : 0)

const isOpen = ref(false)
const rootRef = ref(null)
const displayValue = ref('')
const draftDate = ref(selectedDate.value ? new Date(selectedDate.value) : null)
const draftHour = ref(selectedHour.value)
const draftMinute = ref(selectedMinute.value)

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentDate.value)
)

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDay; i += 1) {
    cells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day))
  }
  return cells
})

function isSameDay(a, b) {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function selectDay(day) {
  if (!day) return
  draftDate.value = new Date(day.getFullYear(), day.getMonth(), day.getDate())
}

function prevMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

function clamp(value, min, max) {
  const num = Number(value)
  if (Number.isNaN(num)) return min
  return Math.min(max, Math.max(min, num))
}

function onHourInput(event) {
  draftHour.value = clamp(event.target.value, 0, 23)
}

function onMinuteInput(event) {
  draftMinute.value = clamp(event.target.value, 0, 59)
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatDisplay(date, hour, minute) {
  if (!date) return ''
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(hour)}:${pad(minute)}`
}

function syncDisplay() {
  displayValue.value = formatDisplay(selectedDate.value, selectedHour.value, selectedMinute.value)
}

function openPicker() {
  draftDate.value = selectedDate.value ? new Date(selectedDate.value) : null
  draftHour.value = selectedHour.value
  draftMinute.value = selectedMinute.value
  if (draftDate.value) {
    currentDate.value = new Date(draftDate.value.getFullYear(), draftDate.value.getMonth(), 1)
  }
  isOpen.value = true
}

function confirmSelection() {
  if (!draftDate.value) {
    isOpen.value = false
    return
  }
  selectedDate.value = new Date(draftDate.value)
  selectedHour.value = draftHour.value
  selectedMinute.value = draftMinute.value
  isOpen.value = false
}

function onDisplayInput(event) {
  displayValue.value = event.target.value
}

function onDisplayBlur() {
  const match = displayValue.value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/)
  if (!match) {
    syncDisplay()
    return
  }
  const [, dd, mm, yyyy, hh, min] = match
  const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  if (Number.isNaN(parsed.getTime())) {
    syncDisplay()
    return
  }
  selectedDate.value = parsed
  selectedHour.value = clamp(hh, 0, 23)
  selectedMinute.value = clamp(min, 0, 59)
  syncDisplay()
}

function handleClickOutside(event) {
  if (rootRef.value && !rootRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

function emitValue() {
  if (!selectedDate.value) {
    emit('update:modelValue', '')
    return
  }
  const d = selectedDate.value
  const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(selectedHour.value)}:${pad(selectedMinute.value)}`
  emit('update:modelValue', iso)
}

watch([selectedDate, selectedHour, selectedMinute], () => {
  syncDisplay()
  emitValue()
}, { immediate: true })

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div ref="rootRef" class="dtp">
    <input
      type="text"
      class="dtp__display"
      :value="displayValue"
      placeholder="DD/MM/AAAA HH:MM"
      @input="onDisplayInput"
      @focus="openPicker()"
      @blur="onDisplayBlur()"
    />

    <div v-if="isOpen" class="dtp__popover">
      <div class="dtp__header">
        <button type="button" class="dtp__nav" aria-label="Previous month" @click="prevMonth()">
          <PhCaretLeft :size="16" weight="bold" />
        </button>
        <span class="dtp__month">{{ monthLabel }}</span>
        <button type="button" class="dtp__nav" aria-label="Next month" @click="nextMonth()">
          <PhCaretRight :size="16" weight="bold" />
        </button>
      </div>

      <div class="dtp__weekdays">
        <span v-for="day in WEEKDAYS" :key="day" class="dtp__weekday">{{ day }}</span>
      </div>

      <div class="dtp__grid">
        <button
          v-for="(day, index) in calendarDays"
          :key="index"
          type="button"
          class="dtp__day"
          :class="{
            'dtp__day--empty': !day,
            'dtp__day--selected': day && isSameDay(day, draftDate),
          }"
          :disabled="!day"
          @click="selectDay(day)"
        >
          {{ day ? day.getDate() : '' }}
        </button>
      </div>

      <div class="dtp__time">
        <span class="dtp__time-label">Hora:</span>
        <input
          class="dtp__time-input"
          type="number"
          min="0"
          max="23"
          :value="draftHour"
          @input="onHourInput"
        />
        <span class="dtp__time-sep">:</span>
        <input
          class="dtp__time-input"
          type="number"
          min="0"
          max="59"
          :value="draftMinute"
          @input="onMinuteInput"
        />
      </div>

      <button type="button" class="dtp__confirm" @click="confirmSelection()">
        OK
      </button>
    </div>
  </div>
</template>

<style scoped>
.dtp {
  position: relative;
}

.dtp__display {
  width: 100%;
  padding: 10px 12px;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-color);
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  outline: none;
  transition: box-shadow 0.15s ease;
}

.dtp__display:focus {
  box-shadow: var(--shadow-1);
}

.dtp__popover {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
}

.dtp__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.dtp__month {
  font-size: 0.875rem;
  font-weight: 900;
  text-transform: capitalize;
  letter-spacing: 0.02em;
}

.dtp__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-color);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.dtp__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.dtp__weekday {
  text-align: center;
  font-size: 0.625rem;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-muted);
}

.dtp__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.dtp__day {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 900;
  color: var(--text-color);
  background: transparent;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.dtp__day:hover:not(:disabled) {
  border-color: var(--border-color);
}

.dtp__day--empty {
  cursor: default;
}

.dtp__day--selected {
  background: var(--accent-color);
  border-color: var(--border-color);
}

.dtp__time {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 2px solid var(--border-color);
}

.dtp__time-label {
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dtp__time-input {
  width: 56px;
  padding: 6px 8px;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 900;
  text-align: center;
  color: var(--text-color);
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  outline: none;
}

.dtp__time-input:focus {
  box-shadow: var(--shadow-1);
}

.dtp__time-sep {
  font-weight: 900;
}

.dtp__confirm {
  padding: 8px 12px;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #000000;
  background: #a3e635;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
</style>
