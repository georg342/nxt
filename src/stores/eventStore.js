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
