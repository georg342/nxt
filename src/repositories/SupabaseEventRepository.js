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
}
