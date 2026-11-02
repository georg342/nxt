<script setup>
import { PhArrowLeft, PhArrowRight } from '@phosphor-icons/vue'
import BrutalCard from '../ui/BrutalCard.vue'
import BrutalButton from '../ui/BrutalButton.vue'
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
          v-for="(day, index) in uiStore.weekDaysData.slice(0, 6)"
          :key="index"
          class="week-grid__day day-card"
          @click="handleDayClick(index)"
        >
          <span class="week-grid__label">{{ day.dayName }}</span>
          <span class="week-grid__date">{{ day.dateNum }}</span>
        </BrutalCard>

        <div class="week-bottom-row">
          <BrutalButton
            class="week-nav-btn"
            color="var(--accent-color)"
            aria-label="Semana anterior"
            @click="uiStore.goToPrevious()"
          >
            <PhArrowLeft :size="24" weight="bold" />
          </BrutalButton>

          <BrutalCard
            class="week-grid__day day-card"
            @click="handleDayClick(6)"
          >
            <span class="week-grid__label">{{ uiStore.weekDaysData[6].dayName }}</span>
            <span class="week-grid__date">{{ uiStore.weekDaysData[6].dateNum }}</span>
          </BrutalCard>

          <BrutalButton
            class="week-nav-btn"
            color="var(--accent-color)"
            aria-label="Próxima semana"
            @click="uiStore.nextWeek()"
          >
            <PhArrowRight :size="24" weight="bold" />
          </BrutalButton>
        </div>
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

/* 4ª linha: prev | domingo | next — colunas 1fr/2fr/1fr centram o domingo */
.week-bottom-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 12px;
  align-items: stretch;
  min-height: 0;
}

.week-nav-btn {
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.week-nav-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 0 var(--border-color, #000);
}
</style>
