import { GENRE_GROUPS, buildGenreGroupIndex } from '../data/genreGroups'

const FALLBACK_GROUP = GENRE_GROUPS.find((g) => g.id === 'other') ?? GENRE_GROUPS[0]

const GENRE_GROUP_INDEX = buildGenreGroupIndex()

/**
 * Returns the genre group that owns the given genre/subgenre.
 * Falls back to the "other" group when not registered.
 * @param {string} genre
 * @returns {import('../data/genreGroups').GenreGroup}
 */
export function getGenreGroup(genre) {
  if (!genre) return FALLBACK_GROUP
  const key = genre.trim().toLowerCase()
  return GENRE_GROUP_INDEX.get(key) ?? FALLBACK_GROUP
}

/**
 * Returns the stable identifying color for a given genre.
 * All genres/subgenres within the same group share the same color site-wide.
 * @param {string} genre
 * @returns {string} hex color
 */
export function getGenreColor(genre) {
  return getGenreGroup(genre).color
}
