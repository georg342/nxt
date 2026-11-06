<script setup>
import { computed, onMounted } from 'vue'
import BrutalCard from '../ui/BrutalCard.vue'
import { useUIStore } from '../../stores/uiStore'
import { useEventStore } from '../../stores/eventStore'
import { getGenreColor } from '../../utils/genreColor'
import { Logger } from '../../utils/logger'

const MAX_GENRE_BADGES = 3

const uiStore = useUIStore()
const eventStore = useEventStore()

// The database may return genres as string[], CSV text or a JSON string.
function parseGenres(value) {
  if (Array.isArray(value)) {
    return value
      .map((genre) => (typeof genre === 'string' ? genre : genre?.label ?? ''))
      .map((genre) => String(genre).trim())
      .filter(Boolean)
  }
  const text = String(value ?? '').trim()
  if (!text) return []
  if (text.startsWith('[')) {
    try {
      return parseGenres(JSON.parse(text))
    } catch {
      return []
    }
  }
  return text
    .split(',')
    .map((genre) => genre.trim())
    .filter(Boolean)
}

const eventsByDateKey = computed(() => {
  const map = new Map()
  for (const event of eventStore.events) {
    const key = String(event.start_date ?? '').slice(0, 10)
    if (!key) continue
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(event)
  }
  return map
})

const weekDays = computed(() => {
  const days = uiStore.weekDaysData.map((day) => {
    const dayEvents = eventsByDateKey.value.get(day.dateKey) ?? []
    const genres = [...new Set(dayEvents.flatMap((e) => parseGenres(e.genres)))]
    return {
      ...day,
      genres: genres.slice(0, MAX_GENRE_BADGES).map((label) => ({
        label,
        color: getGenreColor(label),
      })),
    }
  })

  Logger.info(
    'WeekGrid',
    'weekDays computed — genre trace',
    days.map((day) => {
      const dayEvents = eventsByDateKey.value.get(day.dateKey) ?? []
      return {
        dateKey: day.dateKey,
        dayName: day.dayName,
        events: dayEvents.length,
        rawGenres: dayEvents.map((e) => e.genres),
        badges: day.genres.map((g) => g.label),
      }
    })
  )

  return days
})

onMounted(async () => {
  if (eventStore.events.length === 0) {
    await eventStore.loadEvents()
    if (eventStore.error) {
      Logger.error('WeekGrid', 'Events fetch failed', eventStore.error)
    } else {
      Logger.info('WeekGrid', 'Events fetched', eventStore.events.length)
    }
    return
  }
  Logger.info('WeekGrid', 'Using cached events', eventStore.events.length)
})

function handleDayClick(index) {
  const weekStart = new Date(uiStore.currentDate)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const target = new Date(weekStart)
  target.setDate(weekStart.getDate() + index)
  uiStore.selectDate(target)
}
</script>

<template>
  <div class="week-grid">
    <Transition name="swipe-week" mode="out-in">
      <div
        :key="uiStore.currentDate.getTime()"
        class="week-grid__days"
      >
        <BrutalCard
          v-for="(day, index) in weekDays"
          :key="day.dateKey"
          class="week-grid__day day-card"
          @click="handleDayClick(index)"
        >
          <span class="week-grid__label">{{ day.dayName }}</span>
          <span class="week-grid__date">{{ day.dateNum }}</span>
          <div v-if="day.genres.length" class="week-grid__genres">
            <span
              v-for="genre in day.genres"
              :key="genre.label"
              class="week-grid__genre"
              :style="{ backgroundColor: genre.color }"
            >
              {{ genre.label }}
            </span>
          </div>
        </BrutalCard>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.week-grid {
  position: relative;
  height: 100%;
  padding: 16px 16px 24px 16px;
  box-sizing: border-box;
}

.week-grid__days {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 12px;
  height: 100%;
  width: 100%;
  position: absolute;
  inset: 0;
  padding: 16px 16px 24px 16px;
  box-sizing: border-box;
}

.week-grid__day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: 0;
  overflow: hidden;
  text-align: center;
  cursor: pointer;
}

/* 7º dia ocupa a linha de baixo inteira */
.week-grid__day:last-child {
  grid-column: 1 / -1;
}

.week-grid__label {
  font-weight: 900;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.week-grid__date {
  font-weight: 900;
  font-size: 2.5rem;
  line-height: 1;
}

.week-grid__genres {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  max-width: 100%;
  overflow: hidden;
}

.week-grid__genre {
  max-width: 100%;
  padding: 2px 6px;
  overflow: hidden;
  font-size: 0.625rem;
  font-weight: 900;
  color: #000000;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
}
</style>
