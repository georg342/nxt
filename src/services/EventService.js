/**
 * Abstract interface for event data access.
 * Implementations must override fetchEvents.
 */
export class EventService {
  constructor() {}

  /**
   * @param {{ limit?: number, offset?: number }} [page]
   * @returns {Promise<{ rows: Array, hasMore: boolean }>}
   */
  async fetchEvents({ limit = 100, offset = 0 } = {}) {
    throw new Error('EventService.fetchEvents must be implemented by a subclass')
  }
}
