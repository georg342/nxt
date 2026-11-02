<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  PhCheck,
  PhX,
  PhCheckSquare,
  PhSquare,
  PhCaretDown,
} from '@phosphor-icons/vue'
import BrutalButton from '../ui/BrutalButton.vue'
import { useEventStore } from '../../stores/eventStore'

const eventStore = useEventStore()
const expandedIds = ref([])

const selectedCount = computed(
  () => eventStore.selectedPendingEventIds.length
)
const allSelected = computed(
  () =>
    eventStore.pendingEvents.length > 0 &&
    selectedCount.value === eventStore.pendingEvents.length
)

function isSelected(id) {
  return eventStore.selectedPendingEventIds.includes(id)
}

function toggleSelection(id) {
  const ids = eventStore.selectedPendingEventIds
  const idx = ids.indexOf(id)
  if (idx === -1) ids.push(id)
  else ids.splice(idx, 1)
}

function isExpanded(id) {
  return expandedIds.value.includes(id)
}

function toggleExpanded(id) {
  const idx = expandedIds.value.indexOf(id)
  if (idx === -1) expandedIds.value.push(id)
  else expandedIds.value.splice(idx, 1)
}

function toggleSelectAll() {
  if (allSelected.value) {
    eventStore.selectedPendingEventIds.splice(0)
  } else {
    eventStore.selectedPendingEventIds.splice(
      0,
      eventStore.selectedPendingEventIds.length,
      ...eventStore.pendingEvents.map((e) => e.id)
    )
  }
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function tagLabel(tag) {
  return typeof tag === 'string' ? tag : tag?.label ?? ''
}

onMounted(() => {
  eventStore.fetchPendingEvents()
})
</script>

<template>
  <section class="admin-panel">
    <h2 class="admin-panel__title">Moderação de Eventos</h2>

    <div
      v-if="!eventStore.isLoading && eventStore.pendingEvents.length > 0"
      class="admin-panel__bulk"
    >
      <button
        type="button"
        class="admin-panel__select-all"
        @click="toggleSelectAll"
      >
        <component
          :is="allSelected ? PhCheckSquare : PhSquare"
          :size="18"
          weight="bold"
        />
        <span>{{ allSelected ? 'Desmarcar todos' : 'Selecionar todos' }}</span>
      </button>

      <div v-if="selectedCount > 0" class="admin-panel__bulk-actions">
        <span class="admin-panel__bulk-count">{{ selectedCount }} selecionado(s)</span>
        <BrutalButton
          class="admin-panel__action admin-panel__action--approve"
          @click="eventStore.bulkUpdatePendingEvents('approved')"
        >
          <PhCheck :size="16" weight="bold" />
          APROVAR
        </BrutalButton>
        <BrutalButton
          class="admin-panel__action admin-panel__action--reject"
          @click="eventStore.bulkUpdatePendingEvents('rejected')"
        >
          <PhX :size="16" weight="bold" />
          REJEITAR
        </BrutalButton>
      </div>
    </div>

    <p v-if="eventStore.isLoading" class="admin-panel__state">Carregando...</p>
    <p v-else-if="eventStore.pendingEvents.length === 0" class="admin-panel__state">
      Nenhum evento pendente. A paz reina.
    </p>

    <div v-else class="admin-panel__grid">
      <article
        v-for="event in eventStore.pendingEvents"
        :key="event.id"
        class="admin-panel__card"
        :class="{ 'admin-panel__card--selected': isSelected(event.id) }"
      >
        <header class="admin-panel__card-head">
          <h3 class="admin-panel__card-title">{{ event.title }}</h3>
          <div class="admin-panel__card-head-actions">
            <button
              type="button"
              class="admin-panel__toggle"
              :aria-pressed="isSelected(event.id)"
              aria-label="Selecionar evento"
              @click="toggleSelection(event.id)"
            >
              <component
                :is="isSelected(event.id) ? PhCheckSquare : PhSquare"
                :size="20"
                weight="bold"
              />
            </button>
            <button
              type="button"
              class="admin-panel__toggle admin-panel__toggle--chevron"
              :class="{ 'admin-panel__toggle--open': isExpanded(event.id) }"
              :aria-expanded="isExpanded(event.id)"
              :aria-controls="`admin-details-${event.id}`"
              aria-label="Mostrar detalhes"
              @click="toggleExpanded(event.id)"
            >
              <PhCaretDown :size="20" weight="bold" />
            </button>
          </div>
        </header>
        <p class="admin-panel__card-meta">{{ formatDate(event.start_date) }}</p>
        <p class="admin-panel__card-meta">{{ event.location }}</p>

        <div
          :id="`admin-details-${event.id}`"
          class="admin-panel__details"
          :class="{ 'admin-panel__details--open': isExpanded(event.id) }"
        >
          <div
            class="admin-panel__details-inner"
            :inert="!isExpanded(event.id)"
          >
            <div v-if="event.lineup?.length" class="admin-panel__tags">
              <span
                v-for="(member, index) in event.lineup"
                :key="`lineup-${index}`"
                class="admin-panel__tag"
              >
                {{ tagLabel(member) }}
              </span>
            </div>

            <div v-if="event.genres?.length" class="admin-panel__tags">
              <span
                v-for="(genre, index) in event.genres"
                :key="`genre-${index}`"
                class="admin-panel__tag admin-panel__tag--genre"
              >
                {{ tagLabel(genre) }}
              </span>
            </div>

            <div class="admin-panel__actions">
              <BrutalButton
                class="admin-panel__action admin-panel__action--approve"
                @click="eventStore.approveEvent(event.id)"
              >
                <PhCheck :size="16" weight="bold" />
                APROVAR
              </BrutalButton>
              <BrutalButton
                class="admin-panel__action admin-panel__action--reject"
                @click="eventStore.rejectEvent(event.id)"
              >
                <PhX :size="16" weight="bold" />
                REJEITAR
              </BrutalButton>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.admin-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
}

.admin-panel__title {
  font-size: 1.25rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.admin-panel__state {
  padding: var(--space-4);
  text-align: center;
  font-weight: 900;
  text-transform: uppercase;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--surface-color);
}

.admin-panel__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

.admin-panel__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-1);
}

.admin-panel__card-title {
  font-size: 1rem;
  font-weight: 900;
  text-transform: uppercase;
}

.admin-panel__card-meta {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
}

.admin-panel__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.admin-panel__tag {
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 900;
  color: #000000;
  background: #22d3ee;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
}

.admin-panel__tag--genre {
  background: #facc15;
}

.admin-panel__actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.admin-panel__action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.admin-panel__action--approve {
  background: #a3e635;
  color: #000000;
}

.admin-panel__action--reject {
  background: #fb923c;
  color: #000000;
}

.admin-panel__bulk {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
}

.admin-panel__select-all {
  display: flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 4px 8px;
  background: transparent;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-color);
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.admin-panel__bulk-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.admin-panel__bulk-count {
  flex: 1 1 100%;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-muted);
}

.admin-panel__bulk-actions .admin-panel__action {
  flex: 1 1 0;
}

.admin-panel__card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}

.admin-panel__card-head-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.admin-panel__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  background: transparent;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-color);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.admin-panel__toggle--chevron svg {
  transition: transform 240ms cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-panel__toggle--open svg {
  transform: rotate(180deg);
}

.admin-panel__card--selected {
  outline: 3px solid var(--accent-color);
  outline-offset: 2px;
}

/* shortcut: 0fr → 1fr exige Chrome 107+/Safari 16+/Firefox 66+; trocar por max-height fixo se precisar de navegadores antigos */
.admin-panel__details {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 320ms cubic-bezier(0.32, 0.72, 0, 1);
}

.admin-panel__details--open {
  grid-template-rows: 1fr;
}

.admin-panel__details-inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 0;
  overflow: hidden;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 220ms ease,
    transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
}

.admin-panel__details--open .admin-panel__details-inner {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .admin-panel__toggle--chevron svg,
  .admin-panel__details,
  .admin-panel__details-inner {
    transition: none;
  }
}
</style>
