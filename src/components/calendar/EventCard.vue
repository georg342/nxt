<script setup>
import { computed } from 'vue'
import { PhCalendarBlank, PhClock, PhMapPin } from '@phosphor-icons/vue'
import BrutalCard from '../ui/BrutalCard.vue'
import BrutalButton from '../ui/BrutalButton.vue'
import { useUIStore } from '../../stores/uiStore'

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  expanded: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['toggle'])

const uiStore = useUIStore()

const formattedDate = computed(() => uiStore.formatEventDate(props.event.date))
</script>

<template>
  <BrutalCard
    class="event-card"
    @click="$emit('toggle')"
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
        <span class="event-card__meta-item">
          <PhClock :size="18" weight="duotone" />
          {{ event.time }}
        </span>
        <span class="event-card__meta-item">
          <PhMapPin :size="18" weight="duotone" />
          {{ event.location }}
        </span>
      </div>
    </div>

    <Transition name="accordion">
      <div
        v-if="expanded"
        class="event-card__body"
      >
        <div class="event-card__genres">
          <span
            v-for="genre in event.genres"
            :key="genre"
            class="event-card__pill"
          >
            {{ genre }}
          </span>
        </div>
        <p class="event-card__lineup">
          {{ event.lineup.join(' · ') }}
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
  background-color: var(--accent-color);
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
