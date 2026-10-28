<script setup>
import { useRouter } from 'vue-router'
import { PhSun, PhMoon, PhGlobe } from '@phosphor-icons/vue'
import BrutalButton from '../ui/BrutalButton.vue'
import { useUIStore } from '../../stores/uiStore'

const router = useRouter()
const uiStore = useUIStore()

function goToAdmin() {
  router.push('/admin')
}
</script>

<template>
  <header class="app-header">
    <span
      class="app-header__logo"
      @dblclick="goToAdmin"
    >
      WNXT
    </span>

    <div class="app-header__controls">
      <BrutalButton
        class="app-header__control-btn"
        :aria-label="uiStore.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'"
        @click="uiStore.toggleTheme()"
      >
        <PhSun
          v-if="uiStore.theme === 'dark'"
          :size="18"
          weight="duotone"
        />
        <PhMoon
          v-else
          :size="18"
          weight="duotone"
        />
      </BrutalButton>
      <BrutalButton
        class="app-header__control-btn"
        :aria-label="uiStore.locale === 'pt' ? 'Switch to English' : 'Mudar para Português'"
        @click="uiStore.toggleLocale()"
      >
        <PhGlobe :size="18" weight="duotone" />
        <span class="app-header__locale-label">
          {{ uiStore.locale === 'pt' ? $t('locale.toEn') : $t('locale.toPt') }}
        </span>
      </BrutalButton>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: 16px;
  background-color: var(--surface-color);
  border-bottom: var(--border-width-strong) solid var(--border-color);
  flex-shrink: 0;
}

.app-header__logo {
  font-weight: 900;
  font-size: 1.25rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  user-select: none;
  cursor: pointer;
}

.app-header__controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.app-header__control-btn {
  min-height: 32px;
  min-width: 32px;
  padding: var(--space-1) var(--space-2);
  box-shadow: 2px 2px 0px var(--shadow-color);
}

.app-header__locale-label {
  margin-left: var(--space-1);
  font-weight: 900;
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
}
</style>
