<script setup>
import { ref } from 'vue'
import EventCard from './EventCard.vue'

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

const expandedEventId = ref(null)

function toggleEvent(id) {
  expandedEventId.value = expandedEventId.value === id ? null : id
}
</script>

<template>
  <div class="day-feed">
    <EventCard
      v-for="event in MOCK_EVENTS"
      :key="event.id"
      :event="event"
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

</style>
