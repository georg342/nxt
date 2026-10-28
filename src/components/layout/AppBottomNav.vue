<script setup>
import { computed } from 'vue'
import BrutalButton from '../ui/BrutalButton.vue'
import { useUIStore } from '../../stores/uiStore'

const uiStore = useUIStore()

const activeView = computed(() => uiStore.activeView)

function setView(viewName) {
  uiStore.setActiveView(viewName)
}
</script>

<template>
  <nav class="app-bottom-nav">
    <BrutalButton
      :color="activeView === 'year' ? 'var(--accent-color)' : undefined"
      @click="setView('year')"
    >
      {{ $t('nav.year') }}
    </BrutalButton>
    <BrutalButton
      :color="activeView === 'month' ? 'var(--accent-color)' : undefined"
      @click="setView('month')"
    >
      {{ $t('nav.month') }}
    </BrutalButton>
    <BrutalButton
      :color="activeView === 'week' ? 'var(--accent-color)' : undefined"
      @click="setView('week')"
    >
      {{ $t('nav.week') }}
    </BrutalButton>
    <BrutalButton>{{ $t('nav.today') }}</BrutalButton>
    <BrutalButton color="var(--accent-color)">{{ $t('nav.add') }}</BrutalButton>
  </nav>
</template>

<style scoped>
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
