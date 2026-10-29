<script setup>
import { onMounted, ref } from 'vue'

const STORAGE_KEY = 'wnxt_gate_unlocked'
const ACCESS_CODE = '777'

const emit = defineEmits(['unlock'])

const code = ref('')
const inputRef = ref(null)
const hasError = ref(false)

function handleSubmit() {
  if (code.value.trim() === ACCESS_CODE) {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch (err) {
      console.warn('[AppGate] sessionStorage unavailable:', err)
    }
    emit('unlock')
    return
  }

  hasError.value = true
  code.value = ''
  inputRef.value?.focus()
}

function handleInput() {
  if (hasError.value) hasError.value = false
}

onMounted(() => {
  inputRef.value?.focus()
})
</script>

<template>
  <div class="app-gate">
    <form class="app-gate__form" @submit.prevent="handleSubmit">
      <input
        ref="inputRef"
        v-model="code"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        class="app-gate__input"
        :class="{ 'app-gate__input--error': hasError }"
        aria-label="Access code"
        @input="handleInput"
      />
    </form>
  </div>
</template>

<style scoped>
.app-gate {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
  -webkit-tap-highlight-color: transparent;
}

.app-gate__form {
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-gate__input {
  width: 160px;
  padding: 12px 16px;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.25em;
  color: #fff;
  background-color: transparent;
  border: 2px solid #333;
  border-radius: 12px;
  outline: none;
  caret-color: #fff;
  transition: border-color 0.2s ease;
}

.app-gate__input:focus {
  border-color: #fff;
}

.app-gate__input--error {
  border-color: #ef4444;
  animation: gate-shake 0.3s ease;
}

@keyframes gate-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-6px);
  }
  75% {
    transform: translateX(6px);
  }
}
</style>
