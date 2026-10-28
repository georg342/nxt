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
    isOpen.value = false
    return
  }

  debounceId = setTimeout(async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5`
      )
      const data = await response.json()
      results.value = Array.isArray(data) ? data : []
      isOpen.value = results.value.length > 0
    } catch (err) {
      console.error('[LocationAutocomplete] fetch error:', err)
      results.value = []
      isOpen.value = false
    }
  }, 500)
}

function selectResult(result) {
  searchQuery.value = result.display_name
  emit('update:modelValue', result.display_name)
  isOpen.value = false
  results.value = []
}

function onBlur() {
  setTimeout(() => {
    isOpen.value = false
  }, 150)
}
</script>

<template>
  <div class="location-autocomplete">
    <input
      type="text"
      class="location-autocomplete__input"
      :value="searchQuery"
      @input="onInput"
      @focus="isOpen = results.length > 0"
      @blur="onBlur"
    />
    <ul v-if="isOpen" class="location-autocomplete__dropdown">
      <li
        v-for="(result, index) in results"
        :key="index"
        class="location-autocomplete__item"
        @mousedown.prevent="selectResult(result)"
      >
        {{ result.display_name }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.location-autocomplete {
  position: relative;
}

.location-autocomplete__input {
  width: 100%;
  padding: 10px 12px;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-color);
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  outline: none;
  transition: box-shadow 0.15s ease;
}

.location-autocomplete__input:focus {
  box-shadow: var(--shadow-1);
}

.location-autocomplete__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
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
  border-bottom: 2px solid var(--border-color);
}

.location-autocomplete__item:last-child {
  border-bottom: none;
}

.location-autocomplete__item:hover {
  background: var(--accent-color);
}
</style>
