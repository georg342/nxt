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

    if (error) {
      console.error('[SupabaseEventRepository] createEvent error:', error)
      throw error
    }

    return data ?? null
  }

  /**
   * Fetches pending events ordered by created_at ascending.
   * @returns {Promise<Array>}
   */
  async getPendingEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Supabase RLS Error:', error)
        return []
      }

      return data ?? []
    } catch (err) {
      console.error('Supabase RLS Error:', err)
      return []
    }
  }

  /**
   * Updates the status of an event.
   * @param {string} eventId
   * @param {string} newStatus
   * @returns {Promise<{ error: Object|null }>}
   */
  async updateEventStatus(eventId, newStatus) {
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus })
      .eq('id', eventId)

    if (error) {
      console.error('[SupabaseEventRepository] updateEventStatus error:', error)
      throw error
    }

    return { error: null }
  }

  /**
   * Updates the status of multiple events at once.
   * @param {Array<string>} eventIds
   * @param {string} newStatus
   * @returns {Promise<{ error: Object|null }>}
   */
  async bulkUpdateEventsStatus(eventIds, newStatus) {
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus })
      .in('id', eventIds)

    if (error) {
      console.error('[SupabaseEventRepository] bulkUpdateEventsStatus error:', error)
      throw error
    }

    return { error: null }
  }

  /**
   * Inserts a new admin user into the admin_users table.
   * @param {string} newAdminId
   * @returns {Promise<{ error: Object|null }>}
   */
  async addAdminUser(newAdminId) {
    const { error } = await supabase
      .from('admin_users')
      .insert([{ user_id: newAdminId }])

    if (error) {
      console.error('[SupabaseEventRepository] addAdminUser error:', error)
      throw error
    }

    return { error: null }
  }
}
