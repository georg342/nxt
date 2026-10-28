<script setup>
import { PhArrowRight } from '@phosphor-icons/vue'
import BrutalCard from '../ui/BrutalCard.vue'
import BrutalButton from '../ui/BrutalButton.vue'
import { useUIStore } from '../../stores/uiStore'

const uiStore = useUIStore()
</script>

<template>
  <div class="week-grid">
    <Transition name="swipe-week" mode="out-in">
      <div
        :key="uiStore.currentDate.getTime()"
        class="week-grid__days"
      >
        <BrutalCard
          v-for="(day, index) in uiStore.weekDaysData"
          :key="index"
          class="week-grid__day day-card"
        >
          <span class="week-grid__label">{{ day.dayName }}</span>
          <span class="week-grid__date">{{ day.dateNum }}</span>
        </BrutalCard>
      </div>
    </Transition>

    <BrutalButton
      class="week-grid__next"
      color="var(--accent-color)"
      @click="uiStore.nextWeek()"
    >
      <span>{{ $t('next') }}</span>
      <PhArrowRight :size="24" weight="bold" />
    </BrutalButton>
  </div>
</template>

<style scoped>
.week-grid {
  position: relative;
  height: 100%;
  padding: 16px 16px 24px 16px;
  box-sizing: border-box;
}

.week-grid__days {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 12px;
  height: 100%;
  width: 100%;
  position: absolute;
  inset: 0;
  padding: 16px 16px 24px 16px;
  box-sizing: border-box;
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
  position: absolute;
  right: 16px;
  bottom: 24px;
  width: calc(50% - 22px);
  height: calc(25% - 33px);
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}
</style>
