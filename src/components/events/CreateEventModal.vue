<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhX } from '@phosphor-icons/vue'
import BrutalButton from '../ui/BrutalButton.vue'
import DateTimePicker from '../ui/DateTimePicker.vue'
import TagInput from '../ui/TagInput.vue'
import LocationAutocomplete from '../ui/LocationAutocomplete.vue'
import { useUIStore } from '../../stores/uiStore'
import { useEventStore } from '../../stores/eventStore'
import { useGenreStore } from '../../stores/genreStore'

const { t } = useI18n()
const uiStore = useUIStore()
const eventStore = useEventStore()
const genreStore = useGenreStore()

const isSubmitting = ref(false)
const submitError = ref(null)

const form = ref({
  title: '',
  start_date: '',
  location: '',
  link: '',
  lineup: [],
  genreIds: [],
})

const isEditing = computed(() => Boolean(uiStore.editingEvent))

const genreGroups = computed(() =>
  genreStore.parentGenres.map((parent) => ({
    id: parent.id,
    name: parent.name,
    color: genreStore.getGenreDisplay(parent.id).color,
    children: genreStore.genres
      .filter((genre) => genre.parent_id === parent.id)
      .map((child) => ({
        id: child.id,
        name: child.name,
        // Child chip wears the parent color, per the store priority rule.
        color: genreStore.getGenreDisplay(child.id).color,
      })),
  }))
)

function toggleGenre(genreId) {
  const selected = form.value.genreIds
  const index = selected.indexOf(genreId)
  if (index === -1) selected.push(genreId)
  else selected.splice(index, 1)
}

watch(
  () => uiStore.isCreateEventModalOpen,
  (isOpen) => {
    if (isOpen && genreStore.genres.length === 0) genreStore.loadGenres()
  },
  { immediate: true }
)

const submitLabel = computed(() => {
  if (isSubmitting.value) return t('createEvent.submitting')
  return isEditing.value ? 'Salvar Alterações' : t('createEvent.submit')
})

const INSTAGRAM_URL = /^(https?:\/\/)?(www\.|m\.)?instagram\.com\/.+/i

// Empty link is allowed; anything else must point to instagram.com.
const isLinkValid = computed(() => {
  const link = form.value.link.trim()
  return link === '' || INSTAGRAM_URL.test(link)
})

// Rows may hold genres/lineup as JSON strings, { LABEL, COLOR } pills or
// comma-separated text. Only non-empty labels survive.
function toTags(value) {
  if (!value) return []
  const list = Array.isArray(value) ? value : [value]
  return list
    .map((item) => {
      if (typeof item !== 'string') return item?.LABEL ?? item?.label ?? null
      try {
        const parsed = JSON.parse(item)
        if (typeof parsed === 'string') return parsed
        return parsed?.LABEL ?? parsed?.label ?? null
      } catch {
        return item
      }
    })
    .filter((tag) => typeof tag === 'string' && tag.trim().length > 0)
}

// datetime-local expects YYYY-MM-DDTHH:mm; the API returns full ISO strings.
function toPickerValue(value) {
  return value ? String(value).slice(0, 16) : ''
}

function resetForm() {
  form.value = {
    title: '',
    start_date: '',
    location: '',
    link: '',
    lineup: [],
    genreIds: [],
  }
  submitError.value = null
}

watch(
  () => uiStore.editingEvent,
  (event) => {
    if (!event) {
      resetForm()
      return
    }
    form.value = {
      title: event.title ?? '',
      start_date: toPickerValue(event.start_date),
      location: event.location ?? '',
      link: event.link ?? '',
      lineup: toTags(event.lineup),
      genreIds: (event.genres ?? []).map((genre) => genre.id).filter(Boolean),
    }
    submitError.value = null
  },
  { immediate: true }
)

async function handleSubmit() {
  if (isSubmitting.value || !isLinkValid.value) return
  isSubmitting.value = true
  submitError.value = null

  try {
    const eventData = {
      title: form.value.title.trim(),
      start_date: form.value.start_date,
      location: form.value.location.trim(),
      link: form.value.link.trim(),
      lineup: form.value.lineup,
      genreIds: form.value.genreIds,
    }

    if (isEditing.value) {
      const updated = await eventStore.updateEvent(
        uiStore.editingEvent.id,
        eventData
      )
      if (!updated) {
        submitError.value = t('createEvent.error')
        return
      }
    } else {
      await eventStore.addEvent(eventData)
      uiStore.showToast(t('createEvent.success'), 'success')
    }

    uiStore.cancelEditing()
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
  uiStore.cancelEditing()
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
            <p v-if="!isLinkValid" class="create-event__warning">
              {{ t('createEvent.fields.linkWarning') }}
            </p>
          </div>

          <div class="create-event__field">
            <TagInput
              v-model="form.lineup"
              :label="t('admin.form.lineup')"
              :placeholder="t('admin.form.commaSeparated')"
            />
          </div>

          <div class="create-event__field">
            <span>{{ t('admin.form.genres') }}</span>
            <div class="genre-selector">
              <div
                v-for="group in genreGroups"
                :key="group.id"
                class="genre-selector__group"
              >
                <button
                  type="button"
                  class="genre-chip"
                  :class="{ 'genre-chip--selected': form.genreIds.includes(group.id) }"
                  :style="
                    form.genreIds.includes(group.id)
                      ? { backgroundColor: group.color }
                      : null
                  "
                  @click="toggleGenre(group.id)"
                >
                  {{ group.name }}
                </button>
                <button
                  v-for="child in group.children"
                  :key="child.id"
                  type="button"
                  class="genre-chip genre-chip--child"
                  :class="{ 'genre-chip--selected': form.genreIds.includes(child.id) }"
                  :style="
                    form.genreIds.includes(child.id)
                      ? { backgroundColor: child.color }
                      : null
                  "
                  @click="toggleGenre(child.id)"
                >
                  {{ child.name }}
                </button>
              </div>
            </div>
          </div>

          <p v-if="submitError" class="create-event__error">{{ submitError }}</p>
        </div>

        <div class="create-event__footer">
          <BrutalButton
            type="submit"
            class="create-event__submit"
            color="var(--accent-color)"
            :disabled="isSubmitting || !isLinkValid"
          >
            {{ submitLabel }}
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
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
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

.genre-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
}

.genre-selector__group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.genre-chip {
  padding: 6px 8px;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text-color);
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.genre-chip--child {
  font-size: 0.65rem;
  box-shadow: none;
}

.genre-chip--selected {
  color: #000000;
  transform: translate(2px, 2px);
  box-shadow: none;
}

.create-event__error {
  font-size: 0.75rem;
  font-weight: 900;
  color: #d32f2f;
}

.create-event__warning {
  font-size: 0.75rem;
  font-weight: 900;
  color: #e65100;
  text-transform: none;
  letter-spacing: normal;
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
