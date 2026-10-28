<script setup>
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhX } from '@phosphor-icons/vue'
import BrutalButton from '../ui/BrutalButton.vue'
import { useUIStore } from '../../stores/uiStore'
import { useEventStore } from '../../stores/eventStore'

const { t } = useI18n()
const uiStore = useUIStore()
const eventStore = useEventStore()

const isSubmitting = ref(false)
const submitError = ref(null)

const form = reactive({
  title: '',
  start_date: '',
  location: '',
  lineup: '',
  genres: '',
})

function resetForm() {
  form.title = ''
  form.start_date = ''
  form.location = ''
  form.lineup = ''
  form.genres = ''
  submitError.value = null
}

function parseList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

async function handleSubmit() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  submitError.value = null

  try {
    const eventData = {
      title: form.title.trim(),
      start_date: form.start_date,
      location: form.location.trim(),
      lineup: parseList(form.lineup),
      genres: parseList(form.genres),
    }

    await eventStore.addEvent(eventData)
    resetForm()
    uiStore.closeCreateEventModal()
  } catch (err) {
    submitError.value = err?.message ?? t('createEvent.error')
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  if (isSubmitting.value) return
  resetForm()
  uiStore.closeCreateEventModal()
}
</script>

<template>
  <Transition name="create-event">
    <div
      v-if="uiStore.isCreateEventModalOpen"
      class="create-event"
      role="dialog"
      aria-modal="true"
      @click.self="handleClose()"
    >
      <form class="create-event__card" @submit.prevent="handleSubmit()">
        <button
          type="button"
          class="create-event__close"
          :aria-label="t('createEvent.close')"
          @click="handleClose()"
        >
          <PhX :size="20" weight="bold" />
        </button>

        <h2 class="create-event__title">{{ t('createEvent.title') }}</h2>

        <label class="create-event__field">
          <span>{{ t('createEvent.fields.title') }}</span>
          <input v-model="form.title" type="text" required />
        </label>

        <label class="create-event__field">
          <span>{{ t('createEvent.fields.startDate') }}</span>
          <input v-model="form.start_date" type="datetime-local" required />
        </label>

        <label class="create-event__field">
          <span>{{ t('createEvent.fields.location') }}</span>
          <input v-model="form.location" type="text" required />
        </label>

        <label class="create-event__field">
          <span>{{ t('createEvent.fields.lineup') }}</span>
          <input v-model="form.lineup" type="text" />
        </label>

        <label class="create-event__field">
          <span>{{ t('createEvent.fields.genres') }}</span>
          <input v-model="form.genres" type="text" />
        </label>

        <p v-if="submitError" class="create-event__error">{{ submitError }}</p>

        <BrutalButton
          type="submit"
          class="create-event__submit"
          color="var(--accent-color)"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? t('createEvent.submitting') : t('createEvent.submit') }}
        </BrutalButton>
      </form>
    </div>
  </Transition>
</template>

<style scoped>
.create-event {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overflow-y: auto;
}

.create-event__card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  max-width: 420px;
  padding: var(--space-5);
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
}

.create-event__close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-color);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.create-event__title {
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.create-event__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.create-event__field input {
  padding: 10px 12px;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: none;
  letter-spacing: normal;
  color: var(--text-color);
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  outline: none;
  transition: box-shadow 0.15s ease;
}

.create-event__field input:focus {
  box-shadow: var(--shadow-1);
}

.create-event__error {
  font-size: 0.75rem;
  font-weight: 900;
  color: #d32f2f;
}

.create-event__submit {
  width: 100%;
}

.create-event-enter-active,
.create-event-leave-active {
  transition: opacity 0.25s ease;
}

.create-event-enter-from,
.create-event-leave-to {
  opacity: 0;
}
</style>
