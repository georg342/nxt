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

const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)

function handleTouchStart(event) {
  const touch = event.changedTouches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
}

function handleTouchEnd(event) {
  const touch = event.changedTouches[0]
  touchEndX.value = touch.clientX
  touchEndY.value = touch.clientY
  handleSwipe()
}

function handleSwipe() {
  const deltaX = touchEndX.value - touchStartX.value
  const deltaY = touchEndY.value - touchStartY.value

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
    if (deltaX > 50) {
      uiStore.navigatePrev()
    } else if (deltaX < -50) {
      uiStore.navigateNext()
    }
  }
}

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
  <div
    class="day-feed"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
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
        <h2 class="day-feed__section-title">
          {{ t('dayView.upcomingEvents') }}
        </h2>
        <section
          v-for="group in upcomingGroups"
          :key="group.key"
          class="day-feed__group"
        >
          <h3 class="day-feed__group-title">{{ group.label }}</h3>
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
  flex: 1;
  min-height: 0;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  gap: 16px;
  padding: 0 16px 16px;
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

.day-feed > :first-child {
  margin-top: 16px;
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

.day-feed__section-title {
  margin: 8px 0 0;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-align: center;
  color: var(--accent-color);
}

.day-feed__group-title {
  position: sticky;
  top: 0;
  z-index: 10;
  display: block;
  width: auto;
  margin: 0 -16px;
  padding: 6px 16px 4px;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
  text-align: center;
  color: var(--text-color);
  background-color: var(--bg-color);
  box-shadow: 0 4px 6px -6px rgba(0, 0, 0, 0.2);
}

.day-feed__group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

</style>
