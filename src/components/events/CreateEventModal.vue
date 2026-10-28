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
  link: '',
  lineup: [],
  genres: [],
})

function resetForm() {
  form.value = {
    title: '',
    start_date: '',
    location: '',
    link: '',
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
      link: form.value.link.trim(),
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
          class="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-gray-200 shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer rounded-md"
          :aria-label="t('createEvent.close')"
          @click="handleClose()"
        >
          <PhX :size="20" weight="bold" />
        </button>

        <h2 class="create-event__title">{{ t('createEvent.title') }}</h2>

        <div class="create-event__body">
          <div class="create-event__field">
            <div class="create-event__field-wrap">
              <input
                v-model="form.title"
                type="text"
                class="peer"
                placeholder=" "
                required
              />
              <label class="create-event__label">{{ t('createEvent.fields.title') }}</label>
            </div>
          </div>

          <div class="create-event__field">
            <DateTimePicker
              v-model="form.start_date"
              :label="t('createEvent.fields.startDate')"
            />
          </div>

          <div class="create-event__field">
            <LocationAutocomplete
              v-model="form.location"
              :label="t('createEvent.fields.location')"
            />
          </div>

          <div class="create-event__field">
            <div class="create-event__field-wrap">
              <input
                v-model="form.link"
                type="url"
                class="peer"
                placeholder=" "
              />
              <label class="create-event__label">{{ t('createEvent.fields.link') }}</label>
            </div>
          </div>

          <div class="create-event__field">
            <TagInput
              v-model="form.lineup"
              :label="t('createEvent.fields.lineup')"
            />
          </div>

          <div class="create-event__field">
            <TagInput
              v-model="form.genres"
              :label="t('createEvent.fields.genres')"
            />
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
  height: 90dvh;
  max-height: 100%;
  margin-top: 2.5vh;
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
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

.create-event__body::-webkit-scrollbar {
  width: 8px;
}

.create-event__body::-webkit-scrollbar-track {
  background: transparent;
}

.create-event__body::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 9999px;
}

.create-event__footer {
  position: sticky;
  bottom: 0;
  z-index: 20;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-color);
  border-top: 2px solid var(--border-color);
  box-shadow: 0 -4px 0 0 rgba(0, 0, 0, 0.15);
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
  position: relative;
  z-index: 20;
  padding: var(--space-4);
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  background: var(--surface-color);
  border-bottom: 2px solid var(--border-color);
  box-shadow: 0 4px 0 0 rgba(0, 0, 0, 0.15);
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

.create-event__field-wrap {
  position: relative;
}

.create-event__field input {
  width: 100%;
  padding: 26px 12px 8px;
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

.create-event__label {
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

.create-event__field input:focus + .create-event__label,
.create-event__field input:not(:placeholder-shown) + .create-event__label {
  top: 6px;
  transform: translateY(0) scale(0.7);
  transform-origin: left center;
  color: var(--text-color);
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
