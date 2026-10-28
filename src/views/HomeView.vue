<script setup>
import { computed } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import AppBottomNav from '../components/layout/AppBottomNav.vue'
import YearGrid from '../components/calendar/YearGrid.vue'
import MonthGrid from '../components/calendar/MonthGrid.vue'
import WeekGrid from '../components/calendar/WeekGrid.vue'
import DayFeed from '../components/calendar/DayFeed.vue'
import { useUIStore } from '../stores/uiStore'

const uiStore = useUIStore()

const activeView = computed(() => uiStore.activeView)
</script>

<template>
  <AppLayout>
    <div class="home-view__viewport">
      <Transition :name="uiStore.transitionDirection" mode="out-in">
        <YearGrid v-if="activeView === 'year'" key="year" />
        <MonthGrid v-else-if="activeView === 'month'" key="month" />
        <WeekGrid v-else-if="activeView === 'week'" key="week" />
        <DayFeed v-else-if="activeView === 'day'" key="day" />
      </Transition>
    </div>
    <AppBottomNav />
  </AppLayout>
</template>

<style scoped>
.home-view__viewport {
  position: relative;
  height: 100%;
  overflow: hidden;
  padding-bottom: 100px;
  box-sizing: border-box;
}
</style>
