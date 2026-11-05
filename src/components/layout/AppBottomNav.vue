<script setup>
import { computed, ref } from 'vue'
import BrutalButton from '../ui/BrutalButton.vue'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import {
  PhEye,
  PhCalendar,
  PhCalendarDots,
  PhCalendarDot,
  PhArrowLeft,
  PhArrowRight,
} from '@phosphor-icons/vue'

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
    class="bottom-nav"
    :aria-label="$t('nav.viewOptions')"
  >
    <BrutalButton
      class="nav-btn"
      aria-label="Período anterior"
      @click="uiStore.navigatePrev()"
    >
      <PhArrowLeft :size="24" weight="bold" />
    </BrutalButton>

    <BrutalButton
      class="nav-btn"
      :aria-label="$t('nav.viewOptions')"
      :aria-pressed="isViewMenuOpen"
      @click="isViewMenuOpen = !isViewMenuOpen"
    >
      <PhEye :size="24" weight="duotone" />
    </BrutalButton>

    <template v-if="isViewMenuOpen">
      <BrutalButton
        class="nav-btn"
        :class="{ 'nav-btn--active': activeView === 'year' }"
        aria-label="Year View"
        @click="switchView('year')"
      >
        <PhCalendar :size="24" weight="duotone" />
      </BrutalButton>
      <BrutalButton
        class="nav-btn"
        :class="{ 'nav-btn--active': activeView === 'month' }"
        aria-label="Month View"
        @click="switchView('month')"
      >
        <PhCalendarDots :size="24" weight="duotone" />
      </BrutalButton>
      <BrutalButton
        class="nav-btn"
        :class="{ 'nav-btn--active': activeView === 'week' }"
        aria-label="Week View"
        @click="switchView('week')"
      >
        <PhCalendarDot :size="24" weight="duotone" />
      </BrutalButton>
    </template>

    <template v-else>
      <BrutalButton
        class="nav-btn"
        :class="{ 'nav-btn--active': uiStore.isTodaySelected }"
        @click="uiStore.goToToday()"
      >
        {{ $t('nav.today') }}
      </BrutalButton>
      <BrutalButton class="nav-btn nav-btn--add" @click="handleCreate()">
        {{ $t('nav.add') }}
      </BrutalButton>
    </template>

    <BrutalButton
      class="nav-btn"
      aria-label="Próximo período"
      @click="uiStore.navigateNext()"
    >
      <PhArrowRight :size="24" weight="bold" />
    </BrutalButton>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 50;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 10px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  background-color: var(--surface-color);
  border-top: var(--border-width-strong) solid var(--border-color);
}

.bottom-nav .nav-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  border-radius: var(--radius-button);
  color: var(--text-color);
  transition: background-color 0.15s ease;
}

.bottom-nav .nav-btn:hover,
.bottom-nav .nav-btn:active {
  transform: none;
  box-shadow: none;
}

.bottom-nav .nav-btn--active {
  background: var(--accent-color);
}

.bottom-nav .nav-btn--add {
  font-size: 32px;
  line-height: 1;
}
</style>
