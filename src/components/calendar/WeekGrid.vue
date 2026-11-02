<script setup>
import BrutalCard from '../ui/BrutalCard.vue'
import { useUIStore } from '../../stores/uiStore'

const uiStore = useUIStore()

function handleDayClick(index) {
  const monday = new Date(uiStore.currentDate)
  const day = monday.getDay()
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(monday.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  const target = new Date(monday)
  target.setDate(monday.getDate() + index)
  uiStore.selectDate(target)
}
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
          @click="handleDayClick(index)"
        >
          <span class="week-grid__label">{{ day.dayName }}</span>
          <span class="week-grid__date">{{ day.dateNum }}</span>
        </BrutalCard>
      </div>
    </Transition>
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
  cursor: pointer;
}

/* 7º dia ocupa a linha de baixo inteira */
.week-grid__day:last-child {
  grid-column: 1 / -1;
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
</style>
