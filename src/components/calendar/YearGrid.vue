<script setup>
import MonthFolderCard from './MonthFolderCard.vue'

const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
]

const months = MONTHS.map((month, index) => ({
  month,
  index,
  eventCount: Math.floor(Math.random() * 20),
}))
</script>

<template>
  <div class="year-grid">
    <MonthFolderCard
      v-for="item in months"
      :key="item.month"
      :month="item.month"
      :index="item.index"
      :event-count="item.eventCount"
    />
  </div>
</template>

<style scoped>
.year-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(6, 1fr);
  height: 100%;
  gap: 8px;
  padding: 8px;
  box-sizing: border-box;
}
</style>
