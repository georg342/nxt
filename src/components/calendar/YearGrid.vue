<script setup>
import { computed, onMounted } from 'vue'
import MonthFolderCard from './MonthFolderCard.vue'
import { useUIStore } from '../../stores/uiStore'
import { useEventStore } from '../../stores/eventStore'

const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
]

const uiStore = useUIStore()
const eventStore = useEventStore()

const months = computed(() => {
  // String slice avoids the UTC shift of parsing TIMESTAMPTZ into a Date.
  const year = String(uiStore.currentDate.getFullYear())
  const counts = new Array(12).fill(0)

  for (const event of eventStore.events) {
    const key = String(event.start_date ?? '')
    if (key.slice(0, 4) !== year) continue
    const monthIndex = Number(key.slice(5, 7)) - 1
    if (monthIndex >= 0 && monthIndex < 12) counts[monthIndex] += 1
  }

  return MONTHS.map((month, index) => ({
    month,
    index,
    eventCount: counts[index],
  }))
})

onMounted(() => {
  if (eventStore.events.length === 0) eventStore.loadEvents()
})
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
