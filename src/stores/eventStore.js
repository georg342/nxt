import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { SupabaseEventRepository } from '../repositories/SupabaseEventRepository'
import { useAuthStore } from './authStore'
import { useUIStore } from './uiStore'
import { Logger } from '../utils/logger.js'

// Accepts comma-separated text, plain strings or { label, color } pills and
// always returns a clean array of strings for the database.
function normalizeList(value) {
  const list = Array.isArray(value) ? value : String(value ?? '').split(',')
  return list
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      const label = item?.label ?? item?.LABEL ?? ''
      return String(label).trim()
    })
    .filter(Boolean)
}

export const useEventStore = defineStore('events', () => {
  // Public list: only ever filled by loadEvents() (status = approved).
  const events = ref([])
  // Admin list: only ever filled by fetchAllEvents() (no status filter).
  const allEvents = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const uiStore = useUIStore()

  const pendingEvents = computed(() =>
    allEvents.value.filter((event) => event.status === 'pending')
  )

  const hasActiveFilters = computed(() => uiStore.hasMinSearchLength)

  const filteredEvents = computed(() => {
    if (!uiStore.hasMinSearchLength) return []
    const q = uiStore.searchQuery.trim().toLowerCase()
    if (!q) return []

    return events.value.filter((event) => {
      const haystack = [
        event.title,
        event.location,
        ...(event.lineup ?? []),
        ...(event.genres ?? []).map((g) => g.name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  })

  async function addEvent(eventData) {
    isLoading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()

      if (!authStore.user || !authStore.user.id) {
        Logger.error('EventStore', 'Cannot create event: User is missing or not authenticated')
        error.value = 'User is not authenticated'
        return
      }

      const genreIds = Array.isArray(eventData.genreIds) ? eventData.genreIds : []

      const payload = {
        title: eventData.title,
        start_date: eventData.start_date,
        location: eventData.location,
        link: eventData.link || null,
        lineup: normalizeList(eventData.lineup),
        status: 'pending',
        created_by: authStore.user.id,
      }

      Logger.info('EventStore', 'Sending EXACT payload to Supabase', payload)

      const repository = new SupabaseEventRepository()
      const created = await repository.createEvent(payload, genreIds)
      Logger.info('EventStore', 'Event created successfully')
      await loadEvents()
      return created
    } catch (err) {
      Logger.error('EventStore', 'Failed to create event', err)
      error.value = err?.message ?? 'Failed to create event'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Updates an existing event and refreshes the calendar.
   * @param {string} eventId
   * @param {Object} eventData
   * @returns {Promise<boolean>}
   */
  async function updateEvent(eventId, eventData) {
    const uiStore = useUIStore()
    isLoading.value = true
    error.value = null

    try {
      const genreIds = Array.isArray(eventData.genreIds) ? eventData.genreIds : []

      const payload = {
        title: eventData.title,
        start_date: eventData.start_date,
        location: eventData.location,
        link: eventData.link || null,
        lineup: normalizeList(eventData.lineup),
      }

      const repository = new SupabaseEventRepository()
      await repository.updateEvent(eventId, payload, genreIds)

      const target = allEvents.value.find((evt) => evt.id === eventId)
      if (target) Object.assign(target, payload)

      await loadEvents()

      Logger.info('EventStore', 'Event updated', eventId)
      uiStore.showToast('Evento atualizado', 'success')
      return true
    } catch (err) {
      Logger.error('EventStore', 'Failed to update event', err)
      error.value = err?.message ?? 'Failed to update event'
      uiStore.showToast('Falha ao atualizar evento', 'error')
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function loadEvents() {
    isLoading.value = true
    error.value = null

    try {
      const repository = new SupabaseEventRepository()
      const data = await repository.fetchEvents()
      events.value = data
    } catch (err) {
      error.value = err?.message ?? 'Failed to load events'
      events.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAllEvents() {
    isLoading.value = true
    error.value = null

    try {
      const repository = new SupabaseEventRepository()
      const data = await repository.fetchAllEvents()
      allEvents.value = data
      Logger.info('EventStore', 'All events loaded', data.length)
    } catch (err) {
      Logger.error('EventStore', 'Failed to load all events', err)
      error.value = err?.message ?? 'Failed to load all events'
      allEvents.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function setEventStatus(eventId, newStatus) {
    const uiStore = useUIStore()
    error.value = null

    try {
      const repository = new SupabaseEventRepository()
      await repository.updateEventStatus(eventId, newStatus)

      const target = allEvents.value.find((evt) => evt.id === eventId)
      if (target) target.status = newStatus

      // Keep the public list in sync so an approval shows up without a refetch.
      const inPublicList = events.value.some((evt) => evt.id === eventId)
      if (newStatus === 'approved' && !inPublicList) {
        if (target) {
          events.value.push({ ...target })
          events.value = [...events.value].sort((a, b) =>
            (a.start_date ?? '').localeCompare(b.start_date ?? '')
          )
        }
      } else if (newStatus !== 'approved' && inPublicList) {
        events.value = events.value.filter((evt) => evt.id !== eventId)
      }

      Logger.info('EventStore', 'Event status changed', { eventId, newStatus })
      uiStore.showToast(
        newStatus === 'approved' ? 'Evento aprovado' : 'Evento rejeitado',
        newStatus === 'approved' ? 'success' : 'error'
      )
    } catch (err) {
      Logger.error('EventStore', 'Failed to change event status', err)
      uiStore.showToast('Falha ao alterar status', 'error')
    }
  }

  async function deleteEvent(eventId) {
    const uiStore = useUIStore()

    try {
      const repository = new SupabaseEventRepository()
      await repository.deleteEvent(eventId)

      allEvents.value = allEvents.value.filter((evt) => evt.id !== eventId)
      events.value = events.value.filter((evt) => evt.id !== eventId)

      Logger.info('EventStore', 'Event deleted', eventId)
      uiStore.showToast('Evento excluído', 'success')
    } catch (err) {
      Logger.error('EventStore', 'Failed to delete event', err)
      uiStore.showToast('Falha ao excluir evento', 'error')
    }
  }

  return {
    events,
    allEvents,
    // computed over allEvents; admin-only by construction
    pendingEvents,
    isLoading,
    error,
    hasActiveFilters,
    filteredEvents,
    addEvent,
    updateEvent,
    loadEvents,
    fetchAllEvents,
    setEventStatus,
    deleteEvent,
  }
})
