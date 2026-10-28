import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SupabaseEventRepository } from '../repositories/SupabaseEventRepository'

export const useEventStore = defineStore('events', () => {
  const events = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  async function addEvent(eventData) {
    isLoading.value = true
    error.value = null

    try {
      const repository = new SupabaseEventRepository()
      const created = await repository.createEvent(eventData)
      await loadEvents()
      return created
    } catch (err) {
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
