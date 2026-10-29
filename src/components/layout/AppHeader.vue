<script setup>
import { onMounted, ref } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { PhSun, PhMoon, PhGlobe, PhCheck } from '@phosphor-icons/vue'
import BrutalButton from '../ui/BrutalButton.vue'
import { useUIStore } from '../../stores/uiStore'

const uiStore = useUIStore()

const isColorPickerOpen = ref(false)
const colorPickerRef = ref(null)

let adminTimer = null

const startAdminTimer = () => {
  adminTimer = setTimeout(() => {
    uiStore.openAdminPanel()
  }, 2000)
}

const cancelAdminTimer = () => {
  if (adminTimer) clearTimeout(adminTimer)
}

function toggleColorPicker() {
  isColorPickerOpen.value = !isColorPickerOpen.value
}

function selectAccent(presetId) {
  uiStore.setAccentColor(presetId)
  isColorPickerOpen.value = false
}

onClickOutside(colorPickerRef, () => {
  isColorPickerOpen.value = false
})

onKeyStroke('Escape', () => {
  if (isColorPickerOpen.value) isColorPickerOpen.value = false
})

onMounted(() => {
  uiStore.initAccentColor()
})
</script>

<template>
  <header class="app-header">
    <span class="app-header__logo">
      WNXT
    </span>

    <div class="app-header__controls">
      <div ref="colorPickerRef" class="accent-picker">
        <BrutalButton
          class="app-header__control-btn accent-picker__trigger"
          aria-label="Escolher cor principal"
          aria-haspopup="true"
          :aria-expanded="isColorPickerOpen"
          @click="toggleColorPicker()"
        >
          <span class="accent-picker__dot" aria-hidden="true"></span>
        </BrutalButton>

        <Transition name="accent-card">
          <div
            v-if="isColorPickerOpen"
            class="accent-picker__card"
            role="radiogroup"
            aria-label="Cores principais"
          >
            <button
              v-for="preset in uiStore.accentPresets"
              :key="preset.id"
              type="button"
              class="accent-picker__swatch"
              role="radio"
              :aria-checked="uiStore.accentPreset === preset.id"
              :aria-label="preset.label"
              :style="{ backgroundColor: preset.color }"
              @click="selectAccent(preset.id)"
            >
              <PhCheck
                v-if="uiStore.accentPreset === preset.id"
                :size="14"
                weight="bold"
                :style="{ color: preset.contrast }"
              />
            </button>
          </div>
        </Transition>
      </div>

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
        class="app-header__control-btn lang-toggle-btn"
        :aria-label="uiStore.locale === 'pt' ? 'Switch to English' : 'Mudar para Português'"
        @click="uiStore.toggleLocale()"
        @mousedown="startAdminTimer"
        @touchstart.passive="startAdminTimer"
        @mouseup="cancelAdminTimer"
        @mouseleave="cancelAdminTimer"
        @touchend="cancelAdminTimer"
        @touchcancel="cancelAdminTimer"
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
}

.lang-toggle-btn {
  user-select: none;
  -webkit-touch-callout: none;
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

/* ---------- Accent Color Picker ---------- */
.accent-picker {
  position: relative;
}

.accent-picker__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
}

.accent-picker__dot {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--accent-color);
  border: 2px solid var(--border-color);
}

.accent-picker__card {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 60;
  display: grid;
  grid-template-columns: repeat(3, 32px);
  gap: 10px;
  padding: 12px;
  background-color: var(--surface-color);
  border: var(--border-width-strong) solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
}

.accent-picker__swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.1s ease, box-shadow 0.15s ease;
}

.accent-picker__swatch:active {
  transform: scale(0.92);
}

.accent-picker__swatch[aria-checked='true'] {
  box-shadow: 0 0 0 2px var(--surface-color), 0 0 0 4px var(--border-color);
}

.accent-card-enter-active,
.accent-card-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.accent-card-enter-from,
.accent-card-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}
</style>
