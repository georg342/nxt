import { GenreService } from '../services/GenreService'
import { supabase } from '../lib/supabase'

/**
 * Supabase-backed implementation of GenreService.
 */
export class SupabaseGenreRepository extends GenreService {
  constructor() {
    super()
  }

  /**
   * Fetches all genres ordered by name ascending.
   * @returns {Promise<Array>}
   */
  async fetchGenres() {
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('[SupabaseGenreRepository] fetchGenres error:', error)
      return []
    }

    return data ?? []
  }

  /**
   * Inserts a new genre and returns the created row.
   * @param {Object} genreData
   * @returns {Promise<Object>}
   */
  async createGenre(genreData) {
    const { data, error } = await supabase
      .from('genres')
      .insert([genreData])
      .select()
      .single()

    if (error) {
      console.error('[SupabaseGenreRepository] createGenre error:', error)
      throw error
    }

    return data
  }

  /**
   * Updates a genre and returns the updated row.
   * @param {string} genreId
   * @param {Object} genreData
   * @returns {Promise<Object>}
   */
  async updateGenre(genreId, genreData) {
    const { data, error } = await supabase
      .from('genres')
      .update(genreData)
      .eq('id', genreId)
      .select()
      .single()

    if (error) {
      console.error('[SupabaseGenreRepository] updateGenre error:', error)
      throw error
    }

    return data
  }

  /**
   * Deletes a single genre by id.
   * @param {string} genreId
   * @returns {Promise<{ error: Object|null }>}
   */
  async deleteGenre(genreId) {
    const { error } = await supabase
      .from('genres')
      .delete()
      .eq('id', genreId)

    if (error) {
      console.error('[SupabaseGenreRepository] deleteGenre error:', error)
      throw error
    }

    return { error: null }
  }
}
