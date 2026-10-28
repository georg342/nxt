import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SupabaseEventRepository } from '../repositories/SupabaseEventRepository'
import { useAuthStore } from './authStore'
import { Logger } from '../utils/logger.js'

export const useEventStore = defineStore('events', () => {
  const events = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  async function addEvent(eventData) {
    isLoading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      const payload = {
        ...eventData,
        status: 'pending',
        created_by: authStore.user?.id,
      }

      Logger.debug('EventStore', 'Sending new event payload', payload)

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

  return {
    events,
    isLoading,
    error,
    addEvent,
    loadEvents,
  }
})
