/**
 * Abstract interface for genre data access.
 * Implementations must override fetchGenres, createGenre, updateGenre, deleteGenre.
 */
export class GenreService {
  constructor() {}

  async fetchGenres() {
    throw new Error('GenreService.fetchGenres must be implemented by a subclass')
  }

  async createGenre(data) {
    throw new Error('GenreService.createGenre must be implemented by a subclass')
  }

  async updateGenre(id, data) {
    throw new Error('GenreService.updateGenre must be implemented by a subclass')
  }

  async deleteGenre(id) {
    throw new Error('GenreService.deleteGenre must be implemented by a subclass')
  }
}
