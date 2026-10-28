import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SupabaseEventRepository } from '../repositories/SupabaseEventRepository'
import { useAuthStore } from './authStore'
import { useUIStore } from './uiStore'
import { Logger } from '../utils/logger.js'

export const useEventStore = defineStore('events', () => {
  const events = ref([])
  const allEvents = ref([])
  const pendingEvents = ref([])
  const selectedPendingEventIds = ref([])
  const isLoading = ref(false)
  const error = ref(null)

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

      const payload = {
        title: eventData.title,
        start_date: eventData.start_date,
        location: eventData.location,
        link: eventData.link || null,
        lineup: Array.isArray(eventData.lineup)
          ? eventData.lineup
          : (eventData.lineup || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
        genres: Array.isArray(eventData.genres)
          ? eventData.genres
          : (eventData.genres || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
        status: 'pending',
        created_by: authStore.user.id,
      }

      Logger.info('EventStore', 'Sending EXACT payload to Supabase', payload)

      const repository = new SupabaseEventRepository()
      const created = await repository.createEvent(payload)
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

  async function fetchPendingEvents() {
    isLoading.value = true
    error.value = null

    try {
      const repository = new SupabaseEventRepository()
      const data = await repository.getPendingEvents()
      pendingEvents.value = data
      Logger.info('EventStore', 'Pending events loaded', data.length)
    } catch (err) {
      Logger.error('EventStore', 'Failed to load pending events', err)
      error.value = err?.message ?? 'Failed to load pending events'
      pendingEvents.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function approveEvent(eventId) {
    const uiStore = useUIStore()

    try {
      const repository = new SupabaseEventRepository()
      await repository.updateEventStatus(eventId, 'approved')
      pendingEvents.value = pendingEvents.value.filter((event) => event.id !== eventId)
      Logger.info('EventStore', 'Event approved', eventId)
      uiStore.showToast('Evento aprovado', 'success')
    } catch (err) {
      Logger.error('EventStore', 'Failed to approve event', err)
      uiStore.showToast('Falha ao aprovar evento', 'error')
    }
  }

  async function rejectEvent(eventId) {
    const uiStore = useUIStore()

    try {
      const repository = new SupabaseEventRepository()
      await repository.updateEventStatus(eventId, 'rejected')
      pendingEvents.value = pendingEvents.value.filter((event) => event.id !== eventId)
      Logger.info('EventStore', 'Event rejected', eventId)
      uiStore.showToast('Evento rejeitado', 'error')
    } catch (err) {
      Logger.error('EventStore', 'Failed to reject event', err)
      uiStore.showToast('Falha ao rejeitar evento', 'error')
    }
  }

  async function bulkUpdatePendingEvents(status) {
    const uiStore = useUIStore()
    const ids = [...selectedPendingEventIds.value]

    if (ids.length === 0) return

    try {
      const repository = new SupabaseEventRepository()
      await repository.bulkUpdateEventsStatus(ids, status)
      pendingEvents.value = pendingEvents.value.filter(
        (event) => !ids.includes(event.id)
      )
      selectedPendingEventIds.value = []
      Logger.info('EventStore', 'Bulk update completed', { ids, status })
      uiStore.showToast('Eventos atualizados', 'success')
    } catch (err) {
      Logger.error('EventStore', 'Failed to bulk update events', err)
      uiStore.showToast('Falha ao atualizar eventos', 'error')
    }
  }

  async function addAdminUser(newAdminId) {
    const uiStore = useUIStore()

    try {
      const repository = new SupabaseEventRepository()
      await repository.addAdminUser(newAdminId)
      Logger.info('EventStore', 'Admin user added', newAdminId)
      uiStore.showToast('Admin adicionado', 'success')
      return { success: true }
    } catch (err) {
      Logger.error('EventStore', 'Failed to add admin user', err)
      uiStore.showToast('Falha ao adicionar admin', 'error')
      return { success: false }
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

    try {
      const repository = new SupabaseEventRepository()
      await repository.updateEventStatus(eventId, newStatus)

      const target = allEvents.value.find((evt) => evt.id === eventId)
      if (target) target.status = newStatus

      pendingEvents.value = pendingEvents.value.filter(
        (evt) => evt.id !== eventId
      )
      selectedPendingEventIds.value = selectedPendingEventIds.value.filter(
        (id) => id !== eventId
      )

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
      pendingEvents.value = pendingEvents.value.filter(
        (evt) => evt.id !== eventId
      )
      selectedPendingEventIds.value = selectedPendingEventIds.value.filter(
        (id) => id !== eventId
      )

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
    pendingEvents,
    selectedPendingEventIds,
    isLoading,
    error,
    addEvent,
    loadEvents,
    fetchAllEvents,
    setEventStatus,
    deleteEvent,
    fetchPendingEvents,
    approveEvent,
    rejectEvent,
    bulkUpdatePendingEvents,
    addAdminUser,
  }
})
