<script setup>
import { computed, onMounted } from 'vue'
import BrutalCard from '../ui/BrutalCard.vue'
import { useUIStore } from '../../stores/uiStore'
import { useEventStore } from '../../stores/eventStore'
import { useGenreStore } from '../../stores/genreStore'
import { Logger } from '../../utils/logger'

const MAX_GENRE_BADGES = 8

const uiStore = useUIStore()
const eventStore = useEventStore()
const genreStore = useGenreStore()

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

const weekDays = computed(() =>
  uiStore.weekDaysData.map((day) => {
    const dayEvents = eventsByDateKey.value.get(day.dateKey) ?? []
    const counts = new Map()

    for (const event of dayEvents) {
      // One event counts once per parent genre, even with several subgenres.
      const eventParents = new Set()
      const eventGenres = Array.isArray(event.genres) ? event.genres : []

      for (const raw of eventGenres) {
        const genre = genreStore.getGenreDisplay(raw?.id || raw)
        const parentKey = genre.parentId || genre.id
        if (!parentKey || eventParents.has(parentKey)) continue
        eventParents.add(parentKey)

        const current = counts.get(parentKey)
        counts.set(parentKey, {
          id: parentKey,
          name: genre.parentName || genre.name,
          color: genre.color,
          count: (current?.count ?? 0) + 1,
        })
      }
    }

    const genreBadges = [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_GENRE_BADGES)

    return { ...day, genreBadges }
  })
)

onMounted(async () => {
  if (genreStore.genres.length === 0) {
    await genreStore.loadGenres()
  }

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
          <div class="day-card-inner">
            <div class="day-badges-cluster">
              <span
                v-for="badge in day.genreBadges"
                :key="badge.id"
                class="genre-count-badge"
                :style="{ backgroundColor: badge.color }"
                :title="`${badge.name}: ${badge.count}`"
              >
                {{ badge.count }}
              </span>
            </div>
            <div class="day-date-info">
              <span class="week-grid__label">{{ day.dayName }}</span>
              <span class="week-grid__date">{{ day.dateNum }}</span>
            </div>
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

.day-card-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  gap: 8px;
}

.day-badges-cluster {
  display: grid;
  grid-template-rows: repeat(4, auto);
  grid-auto-flow: column;
  gap: 4px;
  align-content: center;
  justify-content: start;
  min-width: 48px;
}

.genre-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1.5px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 1.5px 1.5px 0px var(--shadow-color, var(--border-color));
  font-size: 0.72rem;
  font-weight: 900;
  color: #000;
  line-height: 1;
}

.day-date-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
}
</style>
