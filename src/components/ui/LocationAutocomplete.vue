<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const searchQuery = ref(props.modelValue)
const results = ref([])
const isOpen = ref(false)
const isSearching = ref(false)
let debounceId = null

watch(
  () => props.modelValue,
  (value) => {
    if (value !== searchQuery.value) {
      searchQuery.value = value
    }
  }
)

function onInput(event) {
  const value = event.target.value
  searchQuery.value = value
  emit('update:modelValue', value)

  if (debounceId) clearTimeout(debounceId)

  if (value.trim().length < 3) {
    results.value = []
    isSearching.value = false
    isOpen.value = true
    return
  }

  isSearching.value = true
  isOpen.value = true

  debounceId = setTimeout(async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5`
      )
      const data = await response.json()
      results.value = Array.isArray(data) ? data : []
      isOpen.value = true
    } catch (err) {
      console.error('[LocationAutocomplete] fetch error:', err)
      results.value = []
      isOpen.value = true
    } finally {
      isSearching.value = false
    }
  }, 500)
}

function onFocus() {
  isOpen.value = true
}

function selectResult(result) {
  searchQuery.value = result.display_name
  emit('update:modelValue', result.display_name)
  isOpen.value = false
  results.value = []
  isSearching.value = false
}

function onBlur() {
  setTimeout(() => {
    isOpen.value = false
  }, 150)
}
</script>

<template>
  <div class="location-autocomplete" :class="{ 'is-open': isOpen }">
    <div class="location-autocomplete__field-wrap">
      <input
        type="text"
        class="location-autocomplete__input peer"
        placeholder=" "
        :value="searchQuery"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />
      <label class="location-autocomplete__label">Localização</label>
    </div>
    <Transition name="dropdown">
      <ul v-if="isOpen" class="location-autocomplete__dropdown">
        <li
          v-if="isSearching"
          class="location-autocomplete__item location-autocomplete__item--state"
        >
          Buscando...
        </li>
        <li
          v-else-if="searchQuery.trim().length < 3"
          class="location-autocomplete__item location-autocomplete__item--state"
        >
          Aguardando
        </li>
        <li
          v-else-if="results.length === 0"
          class="location-autocomplete__item location-autocomplete__item--state"
        >
          Nenhum resultado encontrado.
        </li>
        <li
          v-for="(result, index) in results"
          v-else
          :key="index"
          class="location-autocomplete__item"
          @mousedown.prevent="selectResult(result)"
        >
          {{ result.display_name }}
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.location-autocomplete {
  position: relative;
}

.location-autocomplete__field-wrap {
  position: relative;
}

.location-autocomplete__input {
  width: 100%;
  padding: 18px 12px 8px;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-color);
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  outline: none;
  transition: box-shadow 0.15s ease, border-radius 0.15s ease;
}

.location-autocomplete__input:focus {
  box-shadow: var(--shadow-1);
}

.location-autocomplete__label {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-muted);
  pointer-events: none;
  transition: all 0.15s ease;
}

.location-autocomplete__input:focus + .location-autocomplete__label,
.location-autocomplete__input:not(:placeholder-shown) + .location-autocomplete__label {
  top: 8px;
  transform: translateY(0) scale(0.75);
  transform-origin: left center;
  color: var(--text-color);
}

.location-autocomplete.is-open .location-autocomplete__input {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom-color: transparent;
  box-shadow: 4px 4px 0 0 var(--border-color);
}

.location-autocomplete__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-top: none;
  border-bottom-left-radius: var(--radius-md);
  border-bottom-right-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
  max-height: 200px;
  overflow-y: auto;
}

.location-autocomplete__item {
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-color);
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
}

.location-autocomplete__item:last-child {
  border-bottom: none;
}

.location-autocomplete__item:hover {
  background: var(--accent-color);
}

.location-autocomplete__item--state {
  cursor: default;
  color: var(--text-muted);
  font-style: italic;
}

.location-autocomplete__item--state:hover {
  background: transparent;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
