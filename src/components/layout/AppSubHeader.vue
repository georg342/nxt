<script setup>
import { nextTick, ref, watch } from 'vue'
import { PhCaretLeft, PhMagnifyingGlass, PhX } from '@phosphor-icons/vue'
import { useUIStore } from '../../stores/uiStore'

const uiStore = useUIStore()
const inputRef = ref(null)

watch(
  () => uiStore.isSearchOpen,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      inputRef.value?.focus()
    }
  }
)

function handleClose() {
  uiStore.closeSearch()
}
</script>

<template>
  <div class="app-subheader">
    <button
      v-if="!uiStore.isSearchOpen && uiStore.activeView !== 'year'"
      type="button"
      class="app-subheader__action app-subheader__action--left"
      :aria-label="$t('nav.previous')"
      @click="uiStore.goToPrevious()"
    >
      <PhCaretLeft :size="20" weight="bold" />
    </button>

    <Transition name="fade-text" mode="out-in">
      <input
        v-if="uiStore.isSearchOpen"
        ref="inputRef"
        v-model="uiStore.searchQuery"
        type="text"
        class="app-subheader__input"
        :placeholder="$t('search.placeholder')"
        autocomplete="off"
        spellcheck="false"
        inputmode="search"
        enterkeyhint="search"
      />
      <span
        v-else
        :key="uiStore.contextLabel"
        class="app-subheader__label"
      >
        {{ uiStore.contextLabel }}
      </span>
    </Transition>

    <span
      v-if="!uiStore.isSearchOpen && uiStore.activeView !== 'year'"
      class="app-subheader__spacer"
      aria-hidden="true"
    />

    <button
      v-if="uiStore.isSearchOpen"
      type="button"
      class="app-subheader__action"
      :aria-label="$t('search.close')"
      @click="handleClose"
    >
      <PhX :size="20" weight="bold" />
    </button>
    <button
      v-else
      type="button"
      class="app-subheader__action"
      :aria-label="$t('search.open')"
      @click="uiStore.openSearch()"
    >
      <PhMagnifyingGlass :size="20" weight="bold" />
    </button>
  </div>
</template>

<style scoped>
.app-subheader {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-4);
  background-color: var(--surface-color);
  border-bottom: var(--border-width) solid var(--border-color);
  flex-shrink: 0;
  min-height: 36px;
}

.app-subheader__label {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.02em;
  color: var(--text-color);
  text-align: center;
  pointer-events: none;
  white-space: nowrap;
}

.app-subheader__spacer {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.app-subheader__action--left {
  margin-left: 0;
  margin-right: var(--space-2);
}

.app-subheader__input {
  flex: 1;
  min-width: 0;
  margin-right: var(--space-2);
  background: transparent;
  border: none;
  outline: none;
  font: inherit;
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.02em;
  color: var(--text-color);
  padding: 0;
}

.app-subheader__input::placeholder {
  color: var(--text-muted);
  font-weight: 600;
}

.app-subheader__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-left: var(--space-2);
  padding: 0;
  background: transparent;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
  line-height: 0;
}

.app-subheader__action svg {
  display: block;
  width: 20px;
  height: 20px;
  color: var(--text-color);
  fill: currentColor;
}
</style>
