<script setup>
import { computed, ref } from 'vue'
import { PhCalendarBlank, PhClock, PhMapPin } from '@phosphor-icons/vue'
import BrutalCard from '../ui/BrutalCard.vue'
import BrutalButton from '../ui/BrutalButton.vue'
import { useUIStore } from '../../stores/uiStore'

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  time: {
    type: String,
    default: '',
  },
  expanded: {
    type: Boolean,
    default: false,
  },
})

const uiStore = useUIStore()

const isExpanded = ref(false)

function parsePills(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const parsedGenres = computed(() => parsePills(props.event.genres))
const parsedLineup = computed(() => parsePills(props.event.lineup))

function getShortAddress(address) {
  if (!address) return ''
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 3) {
    const neighborhood = parts[1]
    const city = parts[2]
    const state = parts[3] || ''
    return state ? `${neighborhood}, ${city} - ${state}` : `${neighborhood}, ${city}`
  }
  return address.length > 30 ? `${address.slice(0, 30)}…` : address
}

const formattedDate = computed(() => uiStore.formatEventDate(props.event.date))

function formatTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const displayTime = computed(() => props.time || formatTime(props.event.start_date))
</script>

<template>
  <BrutalCard
    class="event-card"
    @click="isExpanded = !isExpanded"
  >
    <div class="event-card__header">
      <h2 class="event-card__title">{{ event.title }}</h2>
      <div class="event-card__meta">
        <span
          v-if="formattedDate"
          class="event-card__meta-item"
        >
          <PhCalendarBlank :size="18" weight="duotone" />
          {{ formattedDate }}
        </span>
        <div
          v-if="displayTime"
          class="event-time"
          style="display: flex; align-items: center; gap: 4px; margin-top: 4px; font-weight: 600;"
        >
          <PhClock :size="18" weight="duotone" />
          <span>{{ displayTime }}</span>
        </div>
        <span class="event-card__meta-item">
          <PhMapPin :size="18" weight="duotone" />
          {{ isExpanded ? event.location : getShortAddress(event.location) }}
        </span>
      </div>
    </div>

    <Transition name="accordion">
      <div
        v-if="isExpanded"
        class="event-card__body"
      >
        <div
          v-if="parsedGenres.length"
          class="event-card__genres"
        >
          <span
            v-for="(pill, index) in parsedGenres"
            :key="`genre-${index}`"
            class="event-card__pill"
            :style="{ backgroundColor: pill.color || pill.COLOR }"
          >
            {{ pill.label || pill.LABEL }}
          </span>
        </div>
        <p
          v-if="parsedLineup.length"
          class="event-card__lineup"
        >
          {{ parsedLineup.map((p) => p.label || p.LABEL).join(' · ') }}
        </p>
        <BrutalButton color="var(--accent-color)">
          Tickets
        </BrutalButton>
      </div>
    </Transition>
  </BrutalCard>
</template>

<style scoped>
.event-card {
  cursor: pointer;
  flex-shrink: 0;
}

.event-card__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.event-card__title {
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.event-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.event-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 700;
}

.event-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: var(--border-width) solid var(--border-color);
  overflow: hidden;
}

.event-card__genres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.event-card__pill {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-2);
  color: var(--accent-contrast);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.event-card__lineup {
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
