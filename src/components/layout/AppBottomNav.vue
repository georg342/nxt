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
  <Transition name="fade-up">
    <nav
      v-if="isViewMenuOpen"
      class="app-bottom-nav__view-menu"
      :aria-label="$t('nav.viewOptions')"
    >
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
    </nav>
  </Transition>

  <nav class="app-bottom-nav">
    <BrutalButton
      :aria-label="$t('nav.viewOptions')"
      :aria-pressed="isViewMenuOpen"
      @click="isViewMenuOpen = !isViewMenuOpen"
    >
      <PhEye :size="18" weight="duotone" />
    </BrutalButton>
    <BrutalButton
      :color="uiStore.isTodaySelected ? 'var(--accent-color)' : undefined"
      @click="uiStore.goToToday()"
    >
      {{ $t('nav.today') }}
    </BrutalButton>
    <BrutalButton color="var(--accent-color)">{{ $t('nav.add') }}</BrutalButton>
  </nav>
</template>

<style scoped>
.app-bottom-nav__view-menu {
  position: fixed;
  bottom: 96px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  gap: 8px;
  padding: 12px;
  background-color: var(--bg-color);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
  align-items: center;
  justify-content: center;
  width: max-content;
  max-width: 90%;
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

.app-bottom-nav {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  gap: 8px;
  padding: 12px;
  background-color: var(--bg-color);
  border: var(--border-width) solid var(--border-color);
  border-top-width: 1px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
  align-items: center;
  justify-content: center;
  width: max-content;
  max-width: 90%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.app-bottom-nav::-webkit-scrollbar {
  display: none;
}
</style>
