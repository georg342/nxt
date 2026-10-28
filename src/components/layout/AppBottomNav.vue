<script setup>
import { computed, ref } from 'vue'
import BrutalButton from '../ui/BrutalButton.vue'
import { useUIStore } from '../../stores/uiStore'
import { PhEye, PhCalendar, PhCalendarDots, PhCalendarDot } from '@phosphor-icons/vue'

const uiStore = useUIStore()

const activeView = computed(() => uiStore.activeView)
const isViewMenuOpen = ref(false)

function switchView(viewName) {
  uiStore.setActiveView(viewName)
  isViewMenuOpen.value = false
}
</script>

<template>
  <nav class="bottom-nav-pill" :aria-label="$t('nav.viewOptions')">
    <BrutalButton
      :aria-label="$t('nav.viewOptions')"
      :aria-pressed="isViewMenuOpen"
      @click="isViewMenuOpen = !isViewMenuOpen"
    >
      <PhEye :size="18" weight="duotone" />
    </BrutalButton>

    <div class="view-options" :class="{ 'is-open': isViewMenuOpen }">
      <BrutalButton
        :color="activeView === 'year' ? 'var(--accent-color)' : undefined"
        aria-label="Year View"
        @click="switchView('year')"
      >
        <PhCalendar :size="28" weight="duotone" />
      </BrutalButton>
      <BrutalButton
        :color="activeView === 'month' ? 'var(--accent-color)' : undefined"
        aria-label="Month View"
        @click="switchView('month')"
      >
        <PhCalendarDots :size="28" weight="duotone" />
      </BrutalButton>
      <BrutalButton
        :color="activeView === 'week' ? 'var(--accent-color)' : undefined"
        aria-label="Week View"
        @click="switchView('week')"
      >
        <PhCalendarDot :size="28" weight="duotone" />
      </BrutalButton>
    </div>

    <div class="quick-actions" :class="{ 'is-hidden': isViewMenuOpen }">
      <BrutalButton
        :color="uiStore.isTodaySelected ? 'var(--accent-color)' : undefined"
        @click="uiStore.goToToday()"
      >
        {{ $t('nav.today') }}
      </BrutalButton>
      <BrutalButton color="var(--accent-color)">{{ $t('nav.add') }}</BrutalButton>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav-pill {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
  white-space: nowrap;
}

.view-options {
  display: flex;
  gap: 8px;
  max-width: 0px;
  opacity: 0;
  transform: translateX(-20px);
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
  pointer-events: none;
  overflow: hidden;
}

.view-options.is-open {
  max-width: 200px;
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.quick-actions {
  display: flex;
  gap: 8px;
  max-width: 200px;
  opacity: 1;
  transform: translateX(0);
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
  overflow: hidden;
}

.quick-actions.is-hidden {
  max-width: 0px;
  opacity: 0;
  transform: translateX(40px);
  pointer-events: none;
}
</style>
