<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhX } from '@phosphor-icons/vue'
import BrutalButton from '../ui/BrutalButton.vue'
import DateTimePicker from '../ui/DateTimePicker.vue'
import TagInput from '../ui/TagInput.vue'
import LocationAutocomplete from '../ui/LocationAutocomplete.vue'
import { useUIStore } from '../../stores/uiStore'
import { useEventStore } from '../../stores/eventStore'

const { t } = useI18n()
const uiStore = useUIStore()
const eventStore = useEventStore()

const isSubmitting = ref(false)
const submitError = ref(null)

const form = ref({
  title: '',
  start_date: '',
  location: '',
  lineup: [],
  genres: [],
})

function resetForm() {
  form.value = {
    title: '',
    start_date: '',
    location: '',
    lineup: [],
    genres: [],
  }
  submitError.value = null
}

async function handleSubmit() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  submitError.value = null

  try {
    const eventData = {
      title: form.value.title.trim(),
      start_date: form.value.start_date,
      location: form.value.location.trim(),
      lineup: form.value.lineup,
      genres: form.value.genres,
    }

    await eventStore.addEvent(eventData)

    uiStore.showToast(t('createEvent.success'), 'success')

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

        <div class="create-event__body">
          <label class="create-event__field">
            <span>{{ t('createEvent.fields.title') }}</span>
            <input v-model="form.title" type="text" required />
          </label>

          <div class="create-event__field">
            <span>{{ t('createEvent.fields.startDate') }}</span>
            <DateTimePicker v-model="form.start_date" />
          </div>

          <div class="create-event__field">
            <span>{{ t('createEvent.fields.location') }}</span>
            <LocationAutocomplete v-model="form.location" />
          </div>

          <div class="create-event__field">
            <span>{{ t('createEvent.fields.lineup') }}</span>
            <TagInput v-model="form.lineup" />
          </div>

          <div class="create-event__field">
            <span>{{ t('createEvent.fields.genres') }}</span>
            <TagInput v-model="form.genres" />
          </div>

          <p v-if="submitError" class="create-event__error">{{ submitError }}</p>
        </div>

        <div class="create-event__footer">
          <BrutalButton
            type="submit"
            class="create-event__submit"
            color="var(--accent-color)"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? t('createEvent.submitting') : t('createEvent.submit') }}
          </BrutalButton>
        </div>
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
  align-items: flex-start;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overflow-y: auto;
}

.create-event__card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 420px;
  max-height: 85dvh;
  margin-top: 5vh;
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
  overflow: hidden;
}

.create-event__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex: 1;
  padding: var(--space-4);
  overflow-y: auto;
}

.create-event__footer {
  position: sticky;
  bottom: 0;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-color);
  border-top: 2px solid var(--border-color);
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
  padding: var(--space-4) var(--space-4) 0;
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
