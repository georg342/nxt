<script setup>
import { computed, ref } from 'vue'
import { PhMagnifyingGlass } from '@phosphor-icons/vue'
import EventCard from './EventCard.vue'
import { useUIStore } from '../../stores/uiStore'

const MIN_SEARCH_LENGTH = 3

const uiStore = useUIStore()
const expandedEventId = ref(null)

const MOCK_EVENTS = [
  {
    id: 1,
    title: 'Neon Warehouse',
    time: '22:00',
    location: 'Vila Madalena, SP',
    genres: ['Techno', 'House'],
    lineup: ['DJ Vertex', 'Luna Flux', 'Kairo'],
  },
  {
    id: 2,
    title: 'Basement Sessions',
    time: '23:30',
    location: 'Centro, SP',
    genres: ['Minimal', 'Deep House'],
    lineup: ['Sublevel', 'Mara Vex'],
  },
  {
    id: 3,
    title: 'Sunrise Rooftop',
    time: '05:00',
    location: 'Pinheiros, SP',
    genres: ['Melodic Techno'],
    lineup: ['Aurora', 'Nyx'],
  },
]

const normalizedQuery = computed(() =>
  uiStore.searchQuery.trim().toLowerCase()
)

const hasMinLength = computed(
  () => normalizedQuery.value.length >= MIN_SEARCH_LENGTH
)

const results = computed(() => {
  if (!hasMinLength.value) return []
  const q = normalizedQuery.value

  return MOCK_EVENTS.filter((event) => {
    const haystack = [
      event.title,
      event.time,
      event.location,
      ...event.genres,
      ...event.lineup,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

function toggleEvent(id) {
  expandedEventId.value = expandedEventId.value === id ? null : id
}
</script>

<template>
  <div class="search-results">
    <div
      v-if="!hasMinLength"
      class="search-results__hint"
    >
      <PhMagnifyingGlass :size="32" weight="duotone" />
      <p>{{ $t('search.hint') }}</p>
    </div>

    <div
      v-else-if="results.length === 0"
      class="search-results__hint"
    >
      <PhMagnifyingGlass :size="32" weight="duotone" />
      <p>{{ $t('search.empty') }}</p>
    </div>

    <EventCard
      v-for="event in results"
      v-else
      :key="event.id"
      :event="event"
      :expanded="expandedEventId === event.id"
      @toggle="toggleEvent(event.id)"
    />
  </div>
</template>

<style scoped>
.search-results {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  gap: 16px;
  padding: 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  box-sizing: border-box;
}

.search-results::-webkit-scrollbar {
  display: none;
}

.search-results__hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-4);
  color: var(--text-muted);
  font-weight: 700;
  text-align: center;
}
</style>
