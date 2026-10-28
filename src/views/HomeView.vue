<script setup>
import { computed } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import YearGrid from '../components/calendar/YearGrid.vue'
import MonthGrid from '../components/calendar/MonthGrid.vue'
import WeekGrid from '../components/calendar/WeekGrid.vue'
import { useUIStore } from '../stores/uiStore'

const uiStore = useUIStore()

const activeView = computed(() => uiStore.activeView)
</script>

<template>
  <AppLayout>
    <Transition name="view-fade" mode="out-in">
      <YearGrid v-if="activeView === 'year'" key="year" />
      <MonthGrid v-else-if="activeView === 'month'" key="month" />
      <WeekGrid v-else-if="activeView === 'week'" key="week" />
    </Transition>
  </AppLayout>
</template>
