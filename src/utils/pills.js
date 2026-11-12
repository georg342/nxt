/**
 * Normalizes the legacy `event.lineup` pill payload into `{ LABEL, COLOR }`
 * objects. Genres are relational now (event_genres) and do not go through here.
 * @param {Array|string|null} data
 * @returns {Array<Object|string>}
 */
export function parsePills(data) {
  if (!data) return []
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (typeof item === 'string') {
        try {
          return JSON.parse(item)
        } catch {
          return { LABEL: item, COLOR: '#e5e7eb' }
        }
      }
      return item
    })
  }
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return []
    }
  }
  return []
}
