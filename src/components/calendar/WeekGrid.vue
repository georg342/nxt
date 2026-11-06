<script setup>
import { computed, onMounted, onBeforeUnmount, watch, ref } from 'vue'
import BrutalCard from '../ui/BrutalCard.vue'
import { useUIStore } from '../../stores/uiStore'
import { useEventStore } from '../../stores/eventStore'
import { useGenreStore } from '../../stores/genreStore'
import { Logger } from '../../utils/logger'

const MAX_BADGE_SLOTS = 6

const animatingBadgeKey = ref(null)
const typedText = ref('')
// Timers pendentes; limpar no unmount interrompe a sequência inteira.
const timers = new Set()
// Token invalida loops antigos quando a semana muda ou a view desmonta.
let animationToken = 0
let weekChangeTimeoutId = null

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
    // key única: o mesmo gênero pode aparecer em vários dias.
    const visibleBadges = (
      hasOverflow ? badges.slice(0, MAX_BADGE_SLOTS - 1) : badges
    ).map((badge) => ({ ...badge, key: `${day.dateKey}-${badge.id}` }))
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

function delay(ms) {
  return new Promise((resolve) => {
    const id = setTimeout(() => {
      timers.delete(id)
      resolve()
    }, ms)
    timers.add(id)
  })
}

async function runBadgeAnimations(token) {
  while (token === animationToken) {
    const badges = weekDays.value.flatMap((day) => day.genreBadges)

    if (badges.length === 0) {
      await delay(500)
      continue
    }

    for (const badge of badges) {
      if (token !== animationToken) return

      animatingBadgeKey.value = badge.key
      typedText.value = ''

      for (const char of badge.name) {
        if (token !== animationToken) return
        typedText.value += char
        await delay(25)
      }

      await delay(800)
      if (token !== animationToken) return

      while (typedText.value.length > 0) {
        if (token !== animationToken) return
        typedText.value = typedText.value.slice(0, -1)
        await delay(15)
      }

      animatingBadgeKey.value = null
      typedText.value = ''
      await delay(100)
    }
  }
}

// Swipe/setas trocam a semana: abandona o loop atual e recomeça no novo dado.
watch(
  () => uiStore.currentDate.getTime(),
  () => {
    animationToken++
    if (weekChangeTimeoutId) clearTimeout(weekChangeTimeoutId)

    animatingBadgeKey.value = null
    typedText.value = ''

    const currentToken = animationToken
    weekChangeTimeoutId = setTimeout(() => {
      weekChangeTimeoutId = null
      runBadgeAnimations(currentToken)
    }, 400)
  }
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
  } else {
    Logger.info('WeekGrid', 'Using cached events', eventStore.events.length)
  }

  const initialToken = animationToken
  await delay(800)
  if (initialToken === animationToken) {
    runBadgeAnimations(initialToken)
  }
})

onBeforeUnmount(() => {
  animationToken++
  if (weekChangeTimeoutId) clearTimeout(weekChangeTimeoutId)
  for (const id of timers) clearTimeout(id)
  timers.clear()
  animatingBadgeKey.value = null
  typedText.value = ''
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
                :key="badge.key"
                class="genre-count-badge"
                :class="{ 'is-expanding': animatingBadgeKey === badge.key }"
                :style="{ backgroundColor: badge.color }"
                :title="`${badge.name}: ${badge.count}`"
              >
                <template v-if="animatingBadgeKey === badge.key">{{ typedText }}</template>
                <template v-else>{{ badge.count }}</template>
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
  transition: width 0.2s ease, border-radius 0.2s ease, padding 0.2s ease;
}

.genre-count-badge.is-expanding {
  width: auto;
  min-width: 22px;
  padding: 0 6px;
  border-radius: 6px;
  z-index: 10;
  white-space: nowrap;
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
