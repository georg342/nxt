<script setup>
import { computed } from 'vue'
import BrutalButton from '../ui/BrutalButton.vue'
import { useUIStore } from '../../stores/uiStore'
import { PhEye } from '@phosphor-icons/vue'

const uiStore = useUIStore()

const activeView = computed(() => uiStore.activeView)

function setView(viewName) {
  uiStore.setActiveView(viewName)
  uiStore.closeViewMenu()
}
</script>

<template>
  <Transition name="fade-up">
    <nav
      v-if="uiStore.isViewMenuOpen"
      class="app-bottom-nav__view-menu"
      :aria-label="$t('nav.viewOptions')"
    >
      <BrutalButton
        :color="activeView === 'year' ? 'var(--accent-color)' : undefined"
        @click="setView('year')"
      >
        [ 12M ]
      </BrutalButton>
      <BrutalButton
        :color="activeView === 'month' ? 'var(--accent-color)' : undefined"
        @click="setView('month')"
      >
        [ 30D ]
      </BrutalButton>
      <BrutalButton
        :color="activeView === 'week' ? 'var(--accent-color)' : undefined"
        @click="setView('week')"
      >
        [ 7D ]
      </BrutalButton>
    </nav>
  </Transition>

  <nav class="app-bottom-nav">
    <BrutalButton
      :aria-label="$t('nav.viewOptions')"
      :aria-pressed="uiStore.isViewMenuOpen"
      @click="uiStore.toggleViewMenu()"
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
