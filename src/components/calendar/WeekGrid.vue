<script setup>
import { computed } from 'vue'
import BrutalCard from '../ui/BrutalCard.vue'
import BrutalButton from '../ui/BrutalButton.vue'
import { useUIStore } from '../../stores/uiStore'

const uiStore = useUIStore()

const BASE_DAYS = [
  { label: 'MON', date: 14 },
  { label: 'TUE', date: 15 },
  { label: 'WED', date: 16 },
  { label: 'THU', date: 17 },
  { label: 'FRI', date: 18 },
  { label: 'SAT', date: 19 },
  { label: 'SUN', date: 20 },
]

const days = computed(() =>
  BASE_DAYS.map((day) => ({
    ...day,
    date: day.date + uiStore.weekOffset * 7,
  }))
)
</script>

<template>
  <div class="week-grid">
    <Transition name="swipe-week" mode="out-in">
      <div
        :key="uiStore.weekOffset"
        class="week-grid__days"
      >
        <BrutalCard
          v-for="day in days"
          :key="day.label"
          class="week-grid__day"
        >
          <span class="week-grid__label">{{ day.label }}</span>
          <span class="week-grid__date">{{ day.date }}</span>
        </BrutalCard>
      </div>
    </Transition>

    <BrutalButton
      class="week-grid__next"
      color="var(--accent-color)"
      @click="uiStore.nextWeek()"
    >
      NEXT -&gt;
    </BrutalButton>
  </div>
</template>

<style scoped>
.week-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(4, 1fr);
  height: 100%;
  gap: 12px;
  padding: 16px 16px 24px 16px;
  box-sizing: border-box;
}

.week-grid__days {
  display: contents;
}

.week-grid__day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: 0;
  overflow: hidden;
  text-align: center;
}

.week-grid__label {
  font-weight: 900;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.week-grid__date {
  font-weight: 900;
  font-size: 2.5rem;
  line-height: 1;
}

.week-grid__next {
  width: 100%;
  height: 100%;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.05em;
}
</style>
