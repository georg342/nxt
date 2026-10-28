/**
 * Palette of high-contrast colors used to uniquely identify genres.
 * Colors are chosen to work with dark text (--accent-contrast).
 */
const GENRE_PALETTE = [
  '#FFD23F', // yellow
  '#FF6B6B', // coral
  '#4ECDC4', // teal
  '#A78BFA', // violet
  '#F472B6', // pink
  '#60A5FA', // blue
  '#FBBF24', // amber
  '#34D399', // emerald
  '#FB923C', // orange
  '#C084FC', // purple
  '#22D3EE', // cyan
  '#F87171', // red
]

/**
 * Returns a stable color for a given genre name.
 * The same genre always maps to the same color.
 * @param {string} genre
 * @returns {string} hex color
 */
export function getGenreColor(genre) {
  if (!genre) return GENRE_PALETTE[0]
  let hash = 0
  for (let i = 0; i < genre.length; i++) {
    hash = (hash << 5) - hash + genre.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % GENRE_PALETTE.length
  return GENRE_PALETTE[index]
}
