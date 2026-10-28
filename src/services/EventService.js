/**
 * Abstract interface for event data access.
 * Implementations must override fetchEvents.
 */
export class EventService {
  constructor() {}

  /**
   * @param {string} [startDate]
   * @param {string} [endDate]
   * @returns {Promise<Array>}
   */
  async fetchEvents(startDate, endDate) {
    throw new Error('EventService.fetchEvents must be implemented by a subclass')
  }
}
