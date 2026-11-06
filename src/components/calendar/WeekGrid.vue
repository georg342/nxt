<script setup>
import { computed, onMounted } from 'vue'
import BrutalCard from '../ui/BrutalCard.vue'
import { useUIStore } from '../../stores/uiStore'
import { useEventStore } from '../../stores/eventStore'
import { useGenreStore } from '../../stores/genreStore'
import { Logger } from '../../utils/logger'

const MAX_BADGE_SLOTS = 6

const uiStore = useUIStore()
const eventStore = useEventStore()
const genreStore = useGenreStore()

// Busca filtra a view atual no lugar; sem busca, usa a lista completa.
const baseEvents = computed(() => {
  if (uiStore.isSearchOpen && uiStore.hasMinSearchLength) {
    return eventStore.filteredEvents
  }
  return eventStore.events
})

const eventsByDateKey = computed(() => {
  const map = new Map()
  for (const event of baseEvents.value) {
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

    const badges = [...counts.values()].sort((a, b) => b.count - a.count)
    const hasOverflow = badges.length > MAX_BADGE_SLOTS
    const visibleBadges = hasOverflow
      ? badges.slice(0, MAX_BADGE_SLOTS - 1)
      : badges
    const hiddenBadgesCount = hasOverflow
      ? badges.length - (MAX_BADGE_SLOTS - 1)
      : 0

    return {
      ...day,
      hasEvents: dayEvents.length > 0,
      genreBadges: visibleBadges,
      hiddenBadgesCount,
    }
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
          :class="{ 'is-empty': !day.hasEvents }"
          @click="handleDayClick(index)"
        >
          <div class="day-card-inner">
            <div
              v-if="day.genreBadges.length > 0 || day.hiddenBadgesCount > 0"
              class="day-badges-cluster"
            >
              <span
                v-for="badge in day.genreBadges"
                :key="badge.id"
                class="genre-count-badge"
                :style="{ backgroundColor: badge.color }"
                :title="`${badge.name}: ${badge.count}`"
              >
                {{ badge.count }}
              </span>
              <span
                v-if="day.hiddenBadgesCount > 0"
                class="genre-count-badge genre-count-badge--more"
                :title="`+${day.hiddenBadgesCount} genres`"
              >
                +{{ day.hiddenBadgesCount }}
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
  gap: 8px;
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
  padding: 2px 12px 12px 12px;
  min-height: 0;
  overflow: hidden;
  text-align: center;
  cursor: pointer;
}

/* 7º dia ocupa a linha de baixo inteira */
.week-grid__day:last-child {
  grid-column: 1 / -1;
}

.week-grid__day.is-empty {
  /* bloqueia clique e toque por completo */
  pointer-events: none;
  cursor: default;
}

/* esmaece só o conteúdo, preservando borda e sombra do card */
.week-grid__day.is-empty .day-card-inner {
  opacity: 0.4;
}

.week-grid__label {
  font-weight: 900;
  font-size: 0.8125rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.week-grid__date {
  font-weight: 900;
  font-size: 1.5rem;
  line-height: 1;
}

.day-card-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  gap: 4px;
  padding-top: 4px;
}

.day-badges-cluster {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  width: 100%;
  max-width: 100%;
  padding-left: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.genre-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 1.5px 1.5px 0px var(--shadow-color, var(--border-color));
  font-size: 0.65rem;
  font-weight: 900;
  color: #000;
  line-height: 1;
  flex-shrink: 0;
}

.genre-count-badge--more {
  background-color: var(--surface-color, #e5e7eb);
  color: var(--text-color, #000);
}

.day-date-info {
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  text-align: center;
}
</style>
