<script setup>
import { ref } from 'vue'
import { PhX } from '@phosphor-icons/vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const PILL_COLORS = ['#a3e635', '#22d3ee', '#f472b6', '#facc15', '#fb923c']

const inputValue = ref('')

function randomColor() {
  return PILL_COLORS[Math.floor(Math.random() * PILL_COLORS.length)]
}

function addTag() {
  const value = inputValue.value.trim()
  if (!value) return
  if (props.modelValue.some((tag) => tag.label === value)) {
    inputValue.value = ''
    return
  }
  emit('update:modelValue', [...props.modelValue, { label: value, color: randomColor() }])
  inputValue.value = ''
}

function onInput(event) {
  const value = event.target.value
  if (value.includes(',')) {
    const parts = value.split(',')
    const last = parts.pop()
    parts.forEach((part) => {
      const trimmed = part.trim()
      if (!trimmed) return
      if (props.modelValue.some((tag) => tag.label === trimmed)) return
      emit('update:modelValue', [
        ...props.modelValue,
        { label: trimmed, color: randomColor() },
      ])
    })
    inputValue.value = last
    return
  }
  inputValue.value = value
}

function removeTag(index) {
  const next = [...props.modelValue]
  next.splice(index, 1)
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="tag-input">
    <span
      v-for="(tag, index) in modelValue"
      :key="`${tag.label}-${index}`"
      class="tag-input__pill"
      :style="{ backgroundColor: tag.color }"
    >
      {{ tag.label }}
      <button
        type="button"
        class="tag-input__remove"
        :aria-label="`Remove ${tag.label}`"
        @click="removeTag(index)"
      >
        <PhX :size="12" weight="bold" />
      </button>
    </span>
    <input
      :value="inputValue"
      type="text"
      class="tag-input__field"
      @input="onInput"
      @keydown.enter.prevent="addTag()"
      @blur="addTag()"
    />
  </div>
</template>

<style scoped>
.tag-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
}

.tag-input__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 900;
  color: #000000;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
}

.tag-input__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  background: transparent;
  border: none;
  color: #000000;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.tag-input__field {
  flex: 1;
  min-width: 120px;
  padding: 4px;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-color);
  background: transparent;
  border: none;
  outline: none;
}
</style>
