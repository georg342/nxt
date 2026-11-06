<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import EventCard from './EventCard.vue'
import { useEventStore } from '../../stores/eventStore'
import { useGenreStore } from '../../stores/genreStore'
import { useUIStore } from '../../stores/uiStore'

const eventStore = useEventStore()
const genreStore = useGenreStore()
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

// Busca filtra a view atual no lugar; sem busca, usa a lista completa.
const baseEvents = computed(() => {
  if (uiStore.isSearchOpen && uiStore.hasMinSearchLength) {
    return eventStore.filteredEvents
  }
  return eventStore.events
})

const filteredEvents = computed(() => {
  const referenceDate = uiStore.selectedDate ?? new Date()
  const targetKey = toDateKey(referenceDate)
  return baseEvents.value.filter((event) => {
    if (!event.start_date) return false
    return String(event.start_date).slice(0, 10) === targetKey
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
  const selectedKey = toDateKey(referenceDate)

  const groups = new Map()
  for (const event of baseEvents.value) {
    if (!event.start_date) continue
    const eventKey = String(event.start_date).slice(0, 10)
    // Comparação lexicográfica de YYYY-MM-DD equivale à cronológica.
    if (eventKey <= selectedKey) continue

    if (!groups.has(eventKey)) {
      groups.set(eventKey, {
        key: eventKey,
        label: uiStore.formatDayMonth(eventKey),
        events: [],
      })
    }
    groups.get(eventKey).events.push(event)
  }
  return [...groups.values()]
})

// Refetch on every entry into the day view and whenever the selected day
// changes (arrow navigation keeps the component mounted).
watch(
  () => uiStore.selectedDate,
  () => {
    eventStore.loadEvents()
    // Safety net: bootstrap may have failed to fetch genres.
    if (genreStore.genres.length === 0) {
      genreStore.loadGenres()
    }
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
        {{ t('dayView.noEvents') }}
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
  /* box-shadow: 4px 4px 6px 0px rgba(0, 0, 0, 0.35); */
}

.day-feed__group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}


</style>
