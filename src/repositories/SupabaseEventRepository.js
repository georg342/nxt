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
   * Updates an event's editable fields. Status is excluded so an admin edit
   * never demotes an approved event back to pending.
   * @param {string} eventId
   * @param {Object} eventData
   * @returns {Promise<{ error: Object|null }>}
   */
  async updateEvent(eventId, eventData) {
    const { error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', eventId)

    if (error) {
      console.error('[SupabaseEventRepository] updateEvent error:', error)
      throw error
    }

    return { error: null }
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

  /**
   * Read-only check: is this email listed in admin_users?
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  async isAdminEmail(email) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('[SupabaseEventRepository] isAdminEmail error:', error)
      return false
    }

    return Boolean(data)
  }

  /**
   * Fetches ALL events (no status filter) for admin CMS.
   * @returns {Promise<Array>}
   */
  async fetchAllEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[SupabaseEventRepository] fetchAllEvents error:', error)
      throw error
    }

    return data ?? []
  }

  /**
   * Deletes a single event by id.
   * @param {string} eventId
   */
  async deleteEvent(eventId) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) {
      console.error('[SupabaseEventRepository] deleteEvent error:', error)
      throw error
    }
  }
}
