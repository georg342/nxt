<script setup>
import { computed, onMounted, ref } from 'vue'
import EventCard from './EventCard.vue'
import { useEventStore } from '../../stores/eventStore'
import { useUIStore } from '../../stores/uiStore'

const eventStore = useEventStore()
const uiStore = useUIStore()

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

onMounted(() => {
  eventStore.loadEvents()
})
</script>

<template>
  <div class="day-feed">
    <p v-if="eventStore.isLoading" class="day-feed__state">Loading...</p>
    <p v-else-if="filteredEvents.length === 0" class="day-feed__state">
      No events for this day.
    </p>
    <EventCard
      v-for="event in filteredEvents"
      v-else
      :key="event.id"
      :event="event"
      :time="formatTime(event.start_date)"
      :expanded="expandedEventId === event.id"
      @toggle="toggleEvent(event.id)"
    />
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
</style>
