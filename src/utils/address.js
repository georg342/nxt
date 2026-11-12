/**
 * Neighborhood + city + state from a Nominatim-style address, for public cards.
 * @param {string} address
 * @returns {string}
 */
export function getShortAddress(address) {
  if (!address) return ''
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 3) {
    const neighborhood = parts[1]
    const city = parts[2]
    const state = parts[3] || ''
    return state ? `${neighborhood}, ${city} - ${state}` : `${neighborhood}, ${city}`
  }
  return address.length > 30 ? `${address.slice(0, 30)}…` : address
}

/**
 * City + state only, for the denser admin table cells. Intentionally narrower
 * than getShortAddress; do not merge the two.
 * @param {string} address
 * @returns {string}
 */
export function getCityState(address) {
  if (!address) return ''
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 3) {
    const city = parts[2]
    const state = parts[3] || ''
    return state ? `${city} - ${state}` : city
  }
  return address.length > 30 ? `${address.slice(0, 30)}…` : address
}
