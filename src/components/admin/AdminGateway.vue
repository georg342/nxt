<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import {
  PhArrowDown,
  PhArrowLeft,
  PhArrowUp,
  PhCaretDown,
  PhMagnifyingGlass,
} from '@phosphor-icons/vue'
import AppHeader from '../layout/AppHeader.vue'
import AdminGenresManager from './AdminGenresManager.vue'
import { useUIStore } from '../../stores/uiStore'
import { useEventStore } from '../../stores/eventStore'
import { useGenreStore } from '../../stores/genreStore'

const router = useRouter()
const { t } = useI18n()
const uiStore = useUIStore()
const eventStore = useEventStore()
const genreStore = useGenreStore()

const activeTab = ref('events')
const searchQuery = ref('')
const statusFilter = ref('all')
const dateSortOrder = ref(null)
const statusSortOrder = ref(null)
const isStatusDropdownOpen = ref(false)
const statusOptions = [
  { label: 'TODOS OS STATUS', value: 'all' },
  { label: 'PENDENTES', value: 'pending' },
  { label: 'APROVADOS', value: 'approved' },
  { label: 'REJEITADOS', value: 'rejected' },
]
const selectedIds = ref([])
const expandedIds = ref([])
const pendingDeleteId = ref(null)
const statusDropdownRef = ref(null)

const filteredEvents = computed(() => {
  let list = eventStore.allEvents
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((e) => (e.title || '').toLowerCase().includes(q))
  }
  if (statusFilter.value !== 'all') {
    list = list.filter((e) => e.status === statusFilter.value)
  }
  if (dateSortOrder.value) {
    list = [...list].sort(
      (a, b) => new Date(a.start_date) - new Date(b.start_date)
    )
    if (dateSortOrder.value === 'desc') list.reverse()
  }
  if (statusSortOrder.value) {
    list = [...list].sort((a, b) =>
      (a.status || '').localeCompare(b.status || '')
    )
    if (statusSortOrder.value === 'desc') list.reverse()
  }
  return list
})

const isAllSelected = computed(
  () =>
    filteredEvents.value.length > 0 &&
    filteredEvents.value.every((e) => selectedIds.value.includes(e.id))
)

const currentStatusLabel = computed(
  () =>
    statusOptions.find((opt) => opt.value === statusFilter.value)?.label ||
    'TODOS OS STATUS'
)

function toggleSelectAll() {
  selectedIds.value = isAllSelected.value
    ? []
    : filteredEvents.value.map((e) => e.id)
}

function selectStatus(value) {
  statusFilter.value = value
  isStatusDropdownOpen.value = false
}

function toggleDateSort() {
  dateSortOrder.value = dateSortOrder.value === 'asc' ? 'desc' : 'asc'
  statusSortOrder.value = null
}

function toggleStatusSort() {
  statusSortOrder.value = statusSortOrder.value === 'asc' ? 'desc' : 'asc'
  dateSortOrder.value = null
}

function toggleSelect(id) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((x) => x !== id)
    : [...selectedIds.value, id]
}

function isRowExpanded(id) {
  return expandedIds.value.includes(id)
}

function toggleExpanded(id) {
  expandedIds.value = expandedIds.value.includes(id)
    ? expandedIds.value.filter((x) => x !== id)
    : [...expandedIds.value, id]
}

function requestDelete(id) {
  if (pendingDeleteId.value === id) {
    eventStore.deleteEvent(id)
    pendingDeleteId.value = null
  } else {
    pendingDeleteId.value = id
  }
}

function handleEdit(event) {
  uiStore.startEditing(event)
  uiStore.openCreateEventModal()
}

function handleClose() {
  uiStore.closeAdminPanel()
  router.push('/')
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getShortLocation(address) {
  if (!address) return ''
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 3) {
    const city = parts[2]
    const state = parts[3] || ''
    return state ? `${city} - ${state}` : city
  }
  return address.length > 30 ? `${address.slice(0, 30)}…` : address
}

function getStatusLabel(status) {
  return (
    { pending: 'Pendente', approved: 'Aprovado', rejected: 'Rejeitado' }[
      status
    ] ||
    status ||
    '—'
  )
}

function eventGenres(event) {
  const list = Array.isArray(event?.genres) ? event.genres : []
  return list.map((genre) => genreStore.getGenreDisplay(genre.id || genre))
}

function parsePills(data) {
  if (!data) return []
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (typeof item === 'string') {
        try {
          return JSON.parse(item)
        } catch {
          return { LABEL: item, COLOR: '#e5e7eb' }
        }
      }
      return item
    })
  }
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return []
    }
  }
  return []
}

onMounted(async () => {
  if (genreStore.genres.length === 0) genreStore.loadGenres()

  console.log('[AdminGateway] mounted — starting fetchAllEvents')
  await eventStore.fetchAllEvents()
  console.log('[AdminGateway] fetch complete', {
    count: eventStore.allEvents.length,
    error: eventStore.error,
  })
})

onClickOutside(statusDropdownRef, () => {
  isStatusDropdownOpen.value = false
})

onKeyStroke('Escape', () => {
  isStatusDropdownOpen.value = false
})
</script>

<template>
  <div class="cms-container">
    <AppHeader />
    <div class="cms-scroll">
      <div class="cms-inner">
        <!-- HEADER -->
        <header class="cms-header">
          <div class="cms-header__left">
            <button
              type="button"
              class="cms-icon-btn"
              aria-label="Voltar"
              @click="handleClose"
            >
              <PhArrowLeft :size="20" weight="bold" />
            </button>
            <h1 class="cms-title">Painel de Controle</h1>
          </div>
          <span class="cms-count">{{ filteredEvents.length }} evento(s)</span>
        </header>

        <nav class="cms-tabs">
          <button
            type="button"
            class="cms-tab"
            :class="{ 'is-active': activeTab === 'events' }"
            :aria-pressed="activeTab === 'events'"
            @click="activeTab = 'events'"
          >
            Eventos
          </button>
          <button
            type="button"
            class="cms-tab"
            :class="{ 'is-active': activeTab === 'genres' }"
            :aria-pressed="activeTab === 'genres'"
            @click="activeTab = 'genres'"
          >
            Gêneros
          </button>
        </nav>

        <template v-if="activeTab === 'events'">
        <!-- TOOLBAR -->
        <div class="cms-toolbar">
          <div class="cms-search-wrap">
            <PhMagnifyingGlass
              :size="18"
              weight="bold"
              class="cms-search-icon"
            />
            <input
              v-model="searchQuery"
              type="text"
              class="cms-search-input"
              placeholder=" "
            />
            <label class="cms-search-label">Buscar por nome</label>
          </div>

          <div
            ref="statusDropdownRef"
            class="status-dropdown"
            :class="{ 'is-open': isStatusDropdownOpen }"
          >
            <button
              type="button"
              class="status-dropdown__field"
              :aria-expanded="isStatusDropdownOpen"
              aria-haspopup="listbox"
              @click="isStatusDropdownOpen = !isStatusDropdownOpen"
            >
              <span class="status-dropdown__value">{{ currentStatusLabel }}</span>
              <PhCaretDown
                :size="16"
                weight="bold"
                class="status-dropdown__caret"
                :class="{ 'is-open': isStatusDropdownOpen }"
              />
            </button>
            <label class="status-dropdown__label">Status</label>
            <Transition name="dropdown">
              <ul
                v-if="isStatusDropdownOpen"
                class="status-dropdown__menu"
                role="listbox"
              >
                <li
                  v-for="option in statusOptions"
                  :key="option.value"
                  class="status-dropdown__item"
                  :class="{ 'is-active': statusFilter === option.value }"
                  role="option"
                  :aria-selected="statusFilter === option.value"
                  @click="selectStatus(option.value)"
                >
                  {{ option.label }}
                </li>
              </ul>
            </Transition>
          </div>

          <div class="cms-sort-group">
          <button
            type="button"
            class="cms-btn cms-btn--sort"
            :class="{ 'is-active': dateSortOrder }"
            :aria-pressed="Boolean(dateSortOrder)"
            @click="toggleDateSort"
          >
            <PhArrowUp
              v-if="dateSortOrder === 'asc'"
              :size="14"
              weight="bold"
            />
            <PhArrowDown
              v-else-if="dateSortOrder === 'desc'"
              :size="14"
              weight="bold"
            />
            {{ t('admin.list.sortByDate') }}
          </button>

          <button
            type="button"
            class="cms-btn cms-btn--sort"
            :class="{ 'is-active': statusSortOrder }"
            :aria-pressed="Boolean(statusSortOrder)"
            @click="toggleStatusSort"
          >
            <PhArrowUp
              v-if="statusSortOrder === 'asc'"
              :size="14"
              weight="bold"
            />
            <PhArrowDown
              v-else-if="statusSortOrder === 'desc'"
              :size="14"
              weight="bold"
            />
            {{ t('admin.list.sortByStatus') }}
          </button>
          </div>

          <div class="cms-bulk">
            <label class="cms-select-all">
              <input
                type="checkbox"
                class="cms-checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll()"
              />
              <span>Selecionar Todos</span>
            </label>
          </div>
        </div>

        <!-- LISTA -->
        <div class="cms-list">
          <div class="cms-list-header">
            <span></span>
            <span>Nome</span>
            <span>Data</span>
            <span>Local</span>
            <span>Status</span>
          </div>

          <div
            v-for="event in filteredEvents"
            :key="event.id"
            class="cms-row"
            :class="{ 'row-expanded': isRowExpanded(event.id) }"
          >
            <!-- SUMMARY -->
            <div class="cms-row-summary" @click="toggleExpanded(event.id)">
              <div class="cms-cell cms-cell--checkbox" @click.stop>
                <input
                  type="checkbox"
                  class="cms-checkbox"
                  :checked="selectedIds.includes(event.id)"
                  @change="toggleSelect(event.id)"
                />
              </div>
              <div class="cms-cell cms-cell--name">{{ event.title }}</div>
              <div class="cms-cell cms-cell--date">
                {{ formatDate(event.start_date) }}
              </div>
              <div class="cms-cell cms-cell--location">
                {{ getShortLocation(event.location) }}
              </div>
              <div class="cms-cell cms-cell--status">
                <span
                  class="cms-status"
                  :class="`cms-status--${event.status}`"
                >
                  {{ getStatusLabel(event.status) }}
                </span>
                <PhCaretDown
                  :size="16"
                  weight="bold"
                  class="cms-caret"
                />
              </div>
            </div>

            <!-- EXPANDED -->
            <div
              class="cms-row-expander"
              :class="{ 'is-expanded': isRowExpanded(event.id) }"
            >
              <div
                class="cms-row-expanded-inner"
                :inert="!isRowExpanded(event.id)"
              >
                <div class="cms-row-expanded-content">
                  <div class="cms-detail-grid">
                    <div>
                      <strong>Título</strong>
                      <p>{{ event.title }}</p>
                    </div>
                    <div>
                      <strong>Data</strong>
                      <p>{{ formatDateTime(event.start_date) }}</p>
                    </div>
                    <div>
                      <strong>Local</strong>
                      <p>{{ event.location }}</p>
                    </div>
                    <div v-if="event.link">
                      <strong>Link</strong>
                      <p>
                        <a
                          :href="event.link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {{ event.link }}
                        </a>
                      </p>
                    </div>
                    <div v-if="eventGenres(event).length">
                      <strong>Gêneros</strong>
                      <div class="cms-tags">
                        <span
                          v-for="(genre, i) in eventGenres(event)"
                          :key="`g-${i}`"
                          class="cms-tag"
                          :style="{ backgroundColor: genre.color }"
                        >
                          {{ genre.name }}
                        </span>
                      </div>
                    </div>
                    <div v-if="parsePills(event.lineup).length">
                      <strong>Lineup</strong>
                      <div class="cms-tags">
                        <span
                          v-for="(pill, i) in parsePills(event.lineup)"
                          :key="`l-${i}`"
                          class="cms-tag"
                          :style="{
                            backgroundColor: pill?.COLOR || pill?.color || '#e5e7eb',
                          }"
                        >
                          {{ pill?.LABEL || pill?.label || pill }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="cms-actions">
                    <button
                      type="button"
                      class="cms-btn cms-btn--edit"
                      @click="handleEdit(event)"
                    >
                      Editar Evento
                    </button>
                    <button
                      type="button"
                      class="cms-btn cms-btn--approve"
                      :disabled="event.status === 'approved'"
                      @click="eventStore.setEventStatus(event.id, 'approved')"
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      class="cms-btn cms-btn--reject"
                      :disabled="event.status === 'rejected'"
                      @click="eventStore.setEventStatus(event.id, 'rejected')"
                    >
                      Rejeitar
                    </button>
                    <button
                      type="button"
                      class="cms-btn cms-btn--delete"
                      @click="requestDelete(event.id)"
                    >
                      {{
                        pendingDeleteId === event.id
                          ? 'Confirmar Exclusão?'
                          : 'Excluir'
                      }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p v-if="eventStore.isLoading" class="cms-state">Carregando...</p>
          <div v-else-if="eventStore.error" class="cms-state cms-state--error">
            <span>Erro ao carregar eventos: {{ eventStore.error }}</span>
            <button
              type="button"
              class="cms-btn cms-btn--bulk"
              @click="eventStore.fetchAllEvents()"
            >
              Tentar Novamente
            </button>
          </div>
          <p v-else-if="filteredEvents.length === 0" class="cms-state">
            Nenhum evento encontrado.
          </p>
        </div>
        </template>

        <AdminGenresManager v-else />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   OVERLAY + INNER WRAPPER
   ============================================================ */
.cms-container {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: var(--bg-color, #f5f1e8);
  box-sizing: border-box;
}

.cms-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
}

.cms-inner {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ============================================================
   HEADER
   ============================================================ */
.cms-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 4px solid var(--border-color, #000);
  padding-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
}
.cms-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cms-title {
  font-size: 1.5rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.cms-count {
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  padding: 4px 10px;
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  background: var(--bg-color, #fff);
}
.cms-icon-btn {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color, #fff);
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1, 4px 4px 0 0 #000);
  color: var(--text-color, #000);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* ============================================================
   TABS
   ============================================================ */
.cms-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.cms-tab {
  padding: 8px 18px;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-color, #000);
  background: var(--surface-color, #fff);
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  box-shadow: 2px 2px 0 0 var(--border-color, #000);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.cms-tab.is-active {
  color: var(--accent-contrast, #000);
  background: var(--accent-color, #a3e635);
  transform: translate(2px, 2px);
  box-shadow: none;
}

/* ============================================================
   TOOLBAR
   ============================================================ */
.cms-toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 16px;
  border: 2px solid var(--border-color, #000);
  background: var(--surface-color, #fff);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1, 4px 4px 0 0 #000);
  flex-wrap: wrap;
}
.cms-search-wrap {
  position: relative;
  flex: 1 1 260px;
  min-width: 220px;
}
.cms-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted, #555);
  pointer-events: none;
}
.cms-search-input {
  width: 100%;
  padding: 22px 12px 8px 38px;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  background: var(--bg-color, #fff);
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  outline: none;
  color: var(--text-color, #000);
}
.cms-search-input:focus {
  box-shadow: var(--shadow-1, 4px 4px 0 0 #000);
}
.cms-search-label {
  position: absolute;
  left: 38px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-muted, #555);
  pointer-events: none;
  transition: all 0.15s ease;
}
.cms-search-input:focus + .cms-search-label,
.cms-search-input:not(:placeholder-shown) + .cms-search-label {
  top: 6px;
  transform: translateY(0) scale(0.7);
  transform-origin: left center;
  color: var(--text-color, #000);
}
.cms-bulk {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

/* ============================================================
   STATUS DROPDOWN (matches LocationAutocomplete appearance)
   ============================================================ */
.status-dropdown {
  position: relative;
  min-width: 220px;
}

.status-dropdown__field {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 26px 12px 8px;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-color, #000);
  background: var(--bg-color, #fff);
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  outline: none;
  text-transform: uppercase;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: box-shadow 0.15s ease, border-radius 0.15s ease;
}

.status-dropdown__field:focus-visible {
  box-shadow: var(--shadow-1, 4px 4px 0 0 #000);
}

.status-dropdown__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-dropdown__caret {
  flex-shrink: 0;
  color: var(--text-color, #000);
  transition: transform 0.2s ease;
}

.status-dropdown__caret.is-open {
  transform: rotate(180deg);
}

.status-dropdown__label {
  position: absolute;
  top: 6px;
  left: 12px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-color, #000);
  transform: translateY(0) scale(0.7);
  transform-origin: left center;
  pointer-events: none;
}

.status-dropdown.is-open .status-dropdown__field {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom-color: transparent;
  box-shadow: 4px 4px 0 0 var(--border-color, #000);
}

.status-dropdown__menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  margin: -2px 0 0;
  padding: 0;
  list-style: none;
  background: var(--surface-color, #fff);
  border: 2px solid var(--border-color, #000);
  border-top: none;
  border-bottom-left-radius: var(--radius-md);
  border-bottom-right-radius: var(--radius-md);
  box-shadow: var(--shadow-1, 4px 4px 0 0 #000);
  max-height: 240px;
  overflow-y: auto;
}

.status-dropdown__item {
  padding: 10px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-color, #000);
  text-transform: uppercase;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  -webkit-tap-highlight-color: transparent;
}

.status-dropdown__item:last-child {
  border-bottom: none;
}

.status-dropdown__item:hover {
  background: var(--accent-color, #a3e635);
  color: var(--accent-contrast, #fff);
}

.status-dropdown__item.is-active {
  background: var(--border-color, #000);
  color: #fff;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.cms-select-all {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  cursor: pointer;
}
.cms-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-color, #a3e635);
  cursor: pointer;
}

/* ============================================================
   LIST
   ============================================================ */
.cms-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cms-list-header {
  display: grid;
  grid-template-columns: 40px 2fr 1fr 1fr 1fr;
  align-items: center;
  padding: 8px 16px;
  font-size: 0.7rem;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-muted, #555);
  border-bottom: 2px solid var(--border-color, #000);
}
.cms-row {
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  background: var(--surface-color, #fff);
  transition: box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.2s ease;
  overflow: hidden;
}
.cms-row:hover {
  box-shadow: var(--shadow-1, 4px 4px 0 0 #000);
}
/* depois do :hover de propósito: mesma especificidade, o expandido ganha */
.cms-row.row-expanded {
  box-shadow: var(--shadow-2, 8px 8px 0 0 #000);
  transform: translateY(-2px);
}
.cms-row-summary {
  display: grid;
  grid-template-columns: 40px 2fr 1fr 1fr 1fr;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  gap: 8px;
  -webkit-tap-highlight-color: transparent;
}
.cms-cell {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-color, #000);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cms-cell--name {
  font-weight: 900;
  text-transform: uppercase;
}
.cms-cell--checkbox {
  display: flex;
  justify-content: center;
}
.cms-cell--status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.cms-caret {
  color: var(--text-muted, #555);
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.cms-row.row-expanded .cms-caret {
  transform: rotate(180deg);
}
.cms-status {
  padding: 3px 8px;
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  color: #000;
}
.cms-status--pending {
  background: #fde047;
}
.cms-status--approved {
  background: #a3e635;
}
.cms-status--rejected {
  background: #fb923c;
}

/* ============================================================
   EXPANDED
   ============================================================ */
/* shortcut: 0fr → 1fr exige Chrome 107+/Safari 16+/Firefox 66+; trocar por max-height fixo se precisar de navegadores antigos */
.cms-row-expander {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.25s ease;
}
.cms-row-expander.is-expanded {
  grid-template-rows: 1fr;
  opacity: 1;
}
/* padding/borda ficam no .cms-row-expanded-content: no próprio clipper eles
   somariam altura e o estado 0fr não fecharia em 0px */
.cms-row-expanded-inner {
  min-height: 0;
  overflow: hidden;
}
.cms-row-expanded-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-top: 2px dashed var(--border-color, #000);
  background: var(--bg-color, #fafafa);
}
.cms-row-expanded-content > * {
  transform: translateY(-8px);
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.cms-row-expanded-content > *:nth-child(2) {
  transition-delay: 40ms;
}
.cms-row-expander.is-expanded .cms-row-expanded-content > * {
  transform: translateY(0);
}
.cms-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.cms-detail-grid strong {
  display: block;
  font-size: 0.65rem;
  text-transform: uppercase;
  color: var(--text-muted, #555);
  margin-bottom: 4px;
}
.cms-detail-grid p {
  font-size: 0.8125rem;
  font-weight: 700;
  word-break: break-word;
}
.cms-detail-grid a {
  color: #2563eb;
  text-decoration: underline;
  word-break: break-all;
}
.cms-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.cms-tag {
  padding: 3px 8px;
  font-size: 0.7rem;
  font-weight: 900;
  color: #000;
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
}
.cms-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  border-top: 2px dashed var(--border-color, #000);
  padding-top: 12px;
}

/* ============================================================
   BUTTONS
   ============================================================ */
.cms-btn {
  padding: 8px 16px;
  font-size: 0.8125rem;
  font-weight: 900;
  text-transform: uppercase;
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  box-shadow: 2px 2px 0 0 var(--border-color, #000);
  color: #000;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.cms-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 0 var(--border-color, #000);
}
.cms-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.cms-btn--bulk {
  background: #e5e7eb;
}
.cms-btn--sort {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-color, #fff);
  color: var(--text-color, #000);
}
.cms-btn--sort.is-active {
  background: var(--accent-color, #a3e635);
  color: var(--accent-contrast, #000);
}
.cms-sort-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.cms-btn--edit {
  background: #60a5fa;
}
.cms-btn--approve {
  background: #a3e635;
}
.cms-btn--reject {
  background: #fb923c;
}
.cms-btn--delete {
  background: #ef4444;
  color: #fff;
}

/* ============================================================
   STATES
   ============================================================ */
.cms-state {
  padding: 24px;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 900;
  text-transform: uppercase;
  background: var(--surface-color, #fff);
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
}

.cms-state--error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: #fee2e2;
  color: #991b1b;
  border-color: #991b1b;
  text-transform: none;
  font-weight: 700;
}

/* ============================================================
   MOBILE
   ============================================================ */
@media (max-width: 768px) {
  .cms-scroll {
    padding: 16px;
  }
  .cms-inner {
    gap: 16px;
  }
  .cms-list-header {
    grid-template-columns: 32px 1fr auto;
  }
  .cms-row-summary {
    grid-template-columns: 32px 1fr auto;
    grid-template-areas:
      'check name status'
      'check date status';
    row-gap: 2px;
  }
  .cms-row-summary > .cms-cell--checkbox {
    grid-area: check;
  }
  .cms-row-summary > .cms-cell--name {
    grid-area: name;
  }
  .cms-row-summary > .cms-cell--date {
    grid-area: date;
    font-size: 0.7rem;
    color: var(--text-muted, #555);
  }
  .cms-row-summary > .cms-cell--status {
    grid-area: status;
  }
  .cms-list-header > :nth-child(3),
  .cms-list-header > :nth-child(4),
  .cms-cell--location {
    display: none;
  }
  .cms-bulk {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }
  .cms-title {
    font-size: 1.1rem;
  }
  .status-dropdown {
    width: 100%;
    min-width: 0;
  }
}

/* ============================================================
   REDUCED MOTION
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  .cms-row,
  .cms-row-expander,
  .cms-row-expanded-content > *,
  .cms-caret {
    transition: none;
  }
  .cms-row.row-expanded {
    transform: none;
  }
  .cms-row-expanded-content > * {
    transform: none;
  }
}
</style>
