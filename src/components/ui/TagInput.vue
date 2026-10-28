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

const inputValue = ref('')

function addTag() {
  const value = inputValue.value.trim()
  if (!value) return
  if (props.modelValue.includes(value)) {
    inputValue.value = ''
    return
  }
  emit('update:modelValue', [...props.modelValue, value])
  inputValue.value = ''
}

function removeTag(index) {
  const next = [...props.modelValue]
  next.splice(index, 1)
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="tag-input">
    <span v-for="(tag, index) in modelValue" :key="`${tag}-${index}`" class="tag-input__pill">
      {{ tag }}
      <button
        type="button"
        class="tag-input__remove"
        :aria-label="`Remove ${tag}`"
        @click="removeTag(index)"
      >
        <PhX :size="12" weight="bold" />
      </button>
    </span>
    <input
      v-model="inputValue"
      type="text"
      class="tag-input__field"
      @keydown.comma.prevent="addTag()"
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
  background: #a3e635;
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
