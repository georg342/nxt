import { EventService } from '../services/EventService'
import { supabase } from '../lib/supabase'

/**
 * Supabase-backed implementation of EventService.
 */
export class SupabaseEventRepository extends EventService {
  constructor() {
    super()
  }

  /**
   * Fetches approved events ordered by start_date ascending.
   * @param {string} [startDate]
   * @param {string} [endDate]
   * @returns {Promise<Array>}
   */
  async fetchEvents(startDate, endDate) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'approved')
      .order('start_date', { ascending: true })

    if (error) {
      console.error('[SupabaseEventRepository] fetchEvents error:', error)
      return []
    }

    return data ?? []
  }

  /**
   * Inserts a new event. Status and created_by are enforced by RLS.
   * @param {Object} eventData
   * @returns {Promise<Object|null>}
   */
  async createEvent(eventData) {
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single()

    if (error) {
      console.error('[SupabaseEventRepository] createEvent error:', error)
      throw error
    }

    return data ?? null
  }
}
