<script setup>
import { ref } from 'vue'
import { PhClock, PhMapPin } from '@phosphor-icons/vue'
import BrutalCard from '../ui/BrutalCard.vue'
import BrutalButton from '../ui/BrutalButton.vue'

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
    <BrutalCard
      v-for="event in MOCK_EVENTS"
      :key="event.id"
      class="day-feed__card"
      @click="toggleEvent(event.id)"
    >
      <div class="day-feed__header">
        <h2 class="day-feed__title">{{ event.title }}</h2>
        <div class="day-feed__meta">
          <span class="day-feed__meta-item">
            <PhClock :size="18" weight="duotone" />
            {{ event.time }}
          </span>
          <span class="day-feed__meta-item">
            <PhMapPin :size="18" weight="duotone" />
            {{ event.location }}
          </span>
        </div>
      </div>

      <Transition name="accordion">
        <div
          v-if="expandedEventId === event.id"
          class="day-feed__body"
        >
          <div class="day-feed__genres">
            <span
              v-for="genre in event.genres"
              :key="genre"
              class="day-feed__pill"
            >
              {{ genre }}
            </span>
          </div>
          <p class="day-feed__lineup">
            {{ event.lineup.join(' · ') }}
          </p>
          <BrutalButton color="var(--accent-color)">
            Tickets
          </BrutalButton>
        </div>
      </Transition>
    </BrutalCard>
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

.day-feed__card {
  cursor: pointer;
  flex-shrink: 0;
}

.day-feed__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.day-feed__title {
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.day-feed__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.day-feed__meta-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 700;
}

.day-feed__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: var(--border-width) solid var(--border-color);
  overflow: hidden;
}

.day-feed__genres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.day-feed__pill {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-2);
  background-color: var(--accent-color);
  color: var(--accent-contrast);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.day-feed__lineup {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-color);
}

.accordion-enter-active,
.accordion-leave-active {
  transition: max-height 0.3s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.3s cubic-bezier(0.32, 0.72, 0, 1),
    margin-top 0.3s cubic-bezier(0.32, 0.72, 0, 1),
    padding-top 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  max-height: 400px;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  padding-top: 0;
}
</style>
