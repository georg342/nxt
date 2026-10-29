<script setup>
import { computed, ref } from 'vue'
import BrutalButton from '../ui/BrutalButton.vue'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { PhEye, PhCalendar, PhCalendarDots, PhCalendarDot } from '@phosphor-icons/vue'

const uiStore = useUIStore()
const authStore = useAuthStore()

const activeView = computed(() => uiStore.activeView)
const isViewMenuOpen = ref(false)

function switchView(viewName) {
  uiStore.setActiveView(viewName)
  isViewMenuOpen.value = false
}

function handleCreate() {
  if (!authStore.user) {
    authStore.openAuthModal()
    return
  }
  uiStore.openCreateEventModal()
}
</script>

<template>
  <nav
    v-if="!uiStore.isAdminPanelOpen"
    class="bottom-nav-pill"
    :aria-label="$t('nav.viewOptions')"
  >
    <BrutalButton
      class="nav-btn"
      :aria-label="$t('nav.viewOptions')"
      :aria-pressed="isViewMenuOpen"
      @click="isViewMenuOpen = !isViewMenuOpen"
    >
      <PhEye :size="28" weight="duotone" />
    </BrutalButton>

    <div class="view-options" :class="{ 'is-open': isViewMenuOpen }">
      <BrutalButton
        class="nav-btn"
        :color="activeView === 'year' ? 'var(--accent-color)' : undefined"
        aria-label="Year View"
        @click="switchView('year')"
      >
        <PhCalendar :size="28" weight="duotone" />
      </BrutalButton>
      <BrutalButton
        class="nav-btn"
        :color="activeView === 'month' ? 'var(--accent-color)' : undefined"
        aria-label="Month View"
        @click="switchView('month')"
      >
        <PhCalendarDots :size="28" weight="duotone" />
      </BrutalButton>
      <BrutalButton
        class="nav-btn"
        :color="activeView === 'week' ? 'var(--accent-color)' : undefined"
        aria-label="Week View"
        @click="switchView('week')"
      >
        <PhCalendarDot :size="28" weight="duotone" />
      </BrutalButton>
    </div>

    <div class="quick-actions" :class="{ 'is-hidden': isViewMenuOpen }">
      <BrutalButton
        class="nav-btn"
        :color="uiStore.isTodaySelected ? 'var(--accent-color)' : undefined"
        @click="uiStore.goToToday()"
      >
        {{ $t('nav.today') }}
      </BrutalButton>
      <BrutalButton class="nav-btn" color="var(--accent-color)" @click="handleCreate()">
        {{ $t('nav.add') }}
      </BrutalButton>
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
  max-width: 95%;
}

.nav-btn {
  min-width: 48px;
  min-height: 48px;
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

/* Padding matches the button box-shadow offset (4px); the negative margin
   cancels it in layout so the collapse animation via max-width is unaffected.
   This prevents the hard offset shadow from being clipped by overflow: hidden. */
.view-options {
  display: flex;
  gap: 8px;
  max-width: 0px;
  opacity: 0;
  transform: translateX(-20px);
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
  pointer-events: none;
  overflow: hidden;
  flex-shrink: 0;
  padding: 4px;
  margin: -4px;
}

.view-options.is-open {
  max-width: 300px;
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.quick-actions {
  display: flex;
  gap: 8px;
  max-width: 300px;
  opacity: 1;
  transform: translateX(0);
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
  overflow: hidden;
  flex-shrink: 0;
  padding: 4px;
  margin: -4px;
}

.quick-actions.is-hidden {
  max-width: 0px;
  opacity: 0;
  transform: translateX(40px);
  pointer-events: none;
}
</style>
