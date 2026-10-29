/**
 * Central registry of genre groups.
 * Each group aggregates related genres/subgenres under a single identifying color.
 * This is a mock dataset; a future Admin CMS will manage it via Supabase.
 *
 * @typedef {Object} GenreGroup
 * @property {string} id - Stable identifier.
 * @property {string} label - Human-readable group name.
 * @property {string} color - Hex color used across the whole site.
 * @property {string[]} genres - Genres/subgenres belonging to this group (lowercase).
 */

/** @type {GenreGroup[]} */
export const GENRE_GROUPS = [
  {
    id: 'techno',
    label: 'Techno',
    color: '#60A5FA',
    genres: [
      'techno',
      'hard techno',
      'hypnotic techno',
      'melodic techno',
      'minimal techno',
      'acid techno',
      'industrial techno',
      'raw techno',
      'dub techno',
    ],
  },
  {
    id: 'house',
    label: 'House',
    color: '#FBBF24',
    genres: [
      'house',
      'deep house',
      'tech house',
      'progressive house',
      'minimal house',
      'afro house',
      'acid house',
      'garage',
      'uk garage',
      'speed garage',
    ],
  },
  {
    id: 'psytrance',
    label: 'Psytrance',
    color: '#A78BFA',
    genres: [
      'psytrance',
      'psy-trance',
      'full on',
      'fullon',
      'progressive psytrance',
      'dark psy',
      'darkpsy',
      'forest',
      'hi-tech',
      'goa trance',
      'goa',
    ],
  },
  {
    id: 'trance',
    label: 'Trance',
    color: '#C084FC',
    genres: [
      'trance',
      'uplifting trance',
      'progressive trance',
      'vocal trance',
      'hard trance',
    ],
  },
  {
    id: 'drum-and-bass',
    label: 'Drum & Bass',
    color: '#34D399',
    genres: [
      'drum and bass',
      'drum & bass',
      'dnb',
      'liquid dnb',
      'neurofunk',
      'jungle',
      'breakcore',
    ],
  },
  {
    id: 'dubstep',
    label: 'Dubstep / Bass',
    color: '#FB923C',
    genres: [
      'dubstep',
      'riddim',
      'bass',
      'bass music',
      'future bass',
      'trap',
      'glitch hop',
    ],
  },
  {
    id: 'hardcore',
    label: 'Hardcore / Hardstyle',
    color: '#F87171',
    genres: [
      'hardcore',
      'hardstyle',
      'rawstyle',
      'uptempo',
      'frenchcore',
      'gabber',
      'hard dance',
    ],
  },
  {
    id: 'edm',
    label: 'EDM / Big Room',
    color: '#FFD23F',
    genres: [
      'edm',
      'big room',
      'electro house',
      'electro',
      'future house',
      'bounce',
    ],
  },
  {
    id: 'disco',
    label: 'Disco / Funk',
    color: '#F472B6',
    genres: [
      'disco',
      'nu disco',
      'italo disco',
      'funk',
      'boogie',
      'boogie funk',
    ],
  },
  {
    id: 'ambient',
    label: 'Ambient / Downtempo',
    color: '#22D3EE',
    genres: [
      'ambient',
      'downtempo',
      'chillout',
      'chill',
      'idm',
      'experimental',
      'drone',
    ],
  },
  {
    id: 'breaks',
    label: 'Breaks / Electro',
    color: '#4ECDC4',
    genres: [
      'breaks',
      'breakbeat',
      'electro',
      'electro funk',
      'big beat',
      'nu skool breaks',
    ],
  },
  {
    id: 'other',
    label: 'Other',
    color: '#94A3B8',
    genres: [],
  },
]

/**
 * Builds a lookup map from normalized genre -> group.
 * @returns {Map<string, GenreGroup>}
 */
export function buildGenreGroupIndex() {
  const index = new Map()
  for (const group of GENRE_GROUPS) {
    for (const genre of group.genres) {
      index.set(genre.trim().toLowerCase(), group)
    }
  }
  return index
}
