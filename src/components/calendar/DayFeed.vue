<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import EventCard from './EventCard.vue'
import { useEventStore } from '../../stores/eventStore'
import { useUIStore } from '../../stores/uiStore'

const eventStore = useEventStore()
const uiStore = useUIStore()
const { t } = useI18n()

const expandedEventId = ref(null)

function toggleEvent(id) {
  expandedEventId.value = expandedEventId.value === id ? null : id
}

function formatTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const filteredEvents = computed(() => {
  const referenceDate = uiStore.selectedDate ?? new Date()
  const targetYear = referenceDate.getFullYear()
  const targetMonth = referenceDate.getMonth()
  const targetDay = referenceDate.getDate()

  return eventStore.events.filter((event) => {
    if (!event.start_date) return false
    const eventDate = new Date(event.start_date)
    return (
      eventDate.getFullYear() === targetYear &&
      eventDate.getMonth() === targetMonth &&
      eventDate.getDate() === targetDay
    )
  })
})

function toDateKey(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Days after the selected one, grouped by date. eventStore.events already
// holds every approved event ordered by start_date, so no extra request.
const upcomingGroups = computed(() => {
  const referenceDate = uiStore.selectedDate ?? new Date()
  const selectedDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  )

  const groups = new Map()
  for (const event of eventStore.events) {
    if (!event.start_date) continue
    const eventDate = new Date(event.start_date)
    if (Number.isNaN(eventDate.getTime())) continue
    const eventDay = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate()
    )
    if (eventDay <= selectedDay) continue

    const key = toDateKey(eventDay)
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: uiStore.formatDayMonth(key),
        events: [],
      })
    }
    groups.get(key).events.push(event)
  }
  return [...groups.values()]
})

// Refetch on every entry into the day view and whenever the selected day
// changes (arrow navigation keeps the component mounted).
watch(
  () => uiStore.selectedDate,
  () => {
    eventStore.loadEvents()
  },
  { immediate: true }
)
</script>

<template>
  <div class="day-feed">
    <p v-if="eventStore.isLoading" class="day-feed__state">Loading...</p>
    <template v-else>
      <p v-if="filteredEvents.length === 0" class="day-feed__state">
        No events for this day.
      </p>
      <EventCard
        v-for="event in filteredEvents"
        :key="event.id"
        :event="event"
        :time="formatTime(event.start_date)"
        :expanded="expandedEventId === event.id"
        @toggle="toggleEvent(event.id)"
      />
      <template v-if="upcomingGroups.length > 0">
        <div class="day-feed__divider">
          {{ t('dayView.upcomingEvents') }}
        </div>
        <section
          v-for="group in upcomingGroups"
          :key="group.key"
          class="day-feed__group"
        >
          <h2 class="day-feed__group-title">{{ group.label }}</h2>
          <EventCard
            v-for="event in group.events"
            :key="event.id"
            :event="event"
            :time="formatTime(event.start_date)"
            :expanded="expandedEventId === event.id"
            @toggle="toggleEvent(event.id)"
          />
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.day-feed {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  gap: 16px;
  padding: 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  box-sizing: border-box;
  -webkit-mask-image: linear-gradient(
    to bottom,
    #000 0,
    #000 calc(100% - 48px),
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    #000 0,
    #000 calc(100% - 48px),
    transparent 100%
  );
}

.day-feed::-webkit-scrollbar {
  display: none;
}

.day-feed__state {
  margin: 0;
  padding: 24px 16px;
  text-align: center;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--surface-color);
}

.day-feed__divider,
.day-feed__group-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 8px 0;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
  color: var(--text-color);
  background: transparent;
}

.day-feed__divider::before,
.day-feed__divider::after,
.day-feed__group-title::before,
.day-feed__group-title::after {
  content: '';
  flex: 1;
  height: 2px;
  background: var(--text-color);
}

.day-feed__group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

</style>
