/**
 * Returns a new Date set to Sunday 00:00 of the week containing `date`.
 * @param {Date} date
 * @returns {Date}
 */
export function getWeekStart(date) {
  const result = new Date(date)
  result.setDate(result.getDate() - result.getDay())
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Formats a Date as a local `YYYY-MM-DD` key, matching `event.start_date`.
 * @param {Date} date
 * @returns {string}
 */
export function toDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Formats an ISO timestamp as local `HH:MM`.
 * @param {string} dateString
 * @returns {string}
 */
export function formatTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
