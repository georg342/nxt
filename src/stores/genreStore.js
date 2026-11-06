import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { SupabaseGenreRepository } from '../repositories/SupabaseGenreRepository'
import { Logger } from '../utils/logger.js'

const DEFAULT_GENRE_COLOR = '#FACC15'

export const useGenreStore = defineStore('genres', () => {
  const genres = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const parentGenres = computed(() =>
    genres.value.filter((g) => !g.parent_id)
  )

  // Single-pass index for parent lookups; resolution priority:
  // parent.color > own color > DEFAULT_GENRE_COLOR (for children)
  // own color > DEFAULT_GENRE_COLOR (for parents)
  const genreMap = computed(() => {
    const byId = new Map(genres.value.map((g) => [g.id, g]))
    const map = new Map()
    for (const genre of genres.value) {
      const parent = genre.parent_id ? byId.get(genre.parent_id) : null
      const resolvedColor = genre.parent_id
        ? parent?.color || genre.color || DEFAULT_GENRE_COLOR
        : genre.color || DEFAULT_GENRE_COLOR
      map.set(genre.id, {
        ...genre,
        resolvedColor,
        parentIdOrSelf: genre.parent_id || genre.id,
        parentName: parent ? parent.name : genre.name,
      })
    }
    return map
  })

  // Accepts { id }, a raw id string (UUID) or a legacy name string.
  function getGenreDisplay(genreOrId) {
    if (!genreOrId) {
      return {
        id: null,
        name: '',
        color: DEFAULT_GENRE_COLOR,
        parentId: null,
        parentName: '',
      }
    }

    const isObject = typeof genreOrId === 'object'
    const id = isObject ? genreOrId.id : genreOrId
    const nameHint = isObject ? genreOrId.name : genreOrId

    let entry = id ? genreMap.value.get(id) : null

    // Legacy name string (or object without a matching id): fall back to name/slug match
    if (!entry && typeof nameHint === 'string') {
      const lower = nameHint.toLowerCase()
      for (const g of genreMap.value.values()) {
        if (
          g.name?.toLowerCase() === lower ||
          g.slug?.toLowerCase() === lower
        ) {
          entry = g
          break
        }
      }
    }

    if (!entry) {
      return {
        id: isObject ? (id ?? null) : null,
        name: nameHint ?? '',
        color: DEFAULT_GENRE_COLOR,
        parentId: null,
        parentName: nameHint ?? '',
      }
    }

    return {
      id: entry.id,
      name: entry.name,
      color: entry.resolvedColor,
      parentId: entry.parent_id ?? null,
      parentName: entry.parentName,
    }
  }

  async function loadGenres() {
    isLoading.value = true
    error.value = null

    try {
      const repository = new SupabaseGenreRepository()
      const data = await repository.fetchGenres()
      genres.value = data
      Logger.info('GenreStore', 'Genres loaded', data.length)
    } catch (err) {
      Logger.error('GenreStore', 'Failed to load genres', err)
      error.value = err?.message ?? 'Failed to load genres'
      genres.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function addGenre(payload) {
    isLoading.value = true
    error.value = null

    try {
      const repository = new SupabaseGenreRepository()
      await repository.createGenre(payload)
      await loadGenres()
      Logger.info('GenreStore', 'Genre created')
    } catch (err) {
      Logger.error('GenreStore', 'Failed to create genre', err)
      error.value = err?.message ?? 'Failed to create genre'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateGenre(id, payload) {
    isLoading.value = true
    error.value = null

    try {
      const repository = new SupabaseGenreRepository()
      await repository.updateGenre(id, payload)
      await loadGenres()
      Logger.info('GenreStore', 'Genre updated', id)
    } catch (err) {
      Logger.error('GenreStore', 'Failed to update genre', err)
      error.value = err?.message ?? 'Failed to update genre'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function removeGenre(id) {
    isLoading.value = true
    error.value = null

    try {
      const repository = new SupabaseGenreRepository()
      await repository.deleteGenre(id)
      await loadGenres()
      Logger.info('GenreStore', 'Genre deleted', id)
    } catch (err) {
      Logger.error('GenreStore', 'Failed to delete genre', err)
      error.value = err?.message ?? 'Failed to delete genre'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    genres,
    isLoading,
    error,
    parentGenres,
    genreMap,
    getGenreDisplay,
    loadGenres,
    addGenre,
    updateGenre,
    removeGenre,
  }
})
