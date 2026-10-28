<script setup>
import { computed, onMounted, ref } from 'vue'
import { PhCheck, PhX } from '@phosphor-icons/vue'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { useEventStore } from '../../stores/eventStore'

const uiStore = useUIStore()
const authStore = useAuthStore()
const eventStore = useEventStore()

const activeTab = ref('pending')
const newAdminUuid = ref('')

const isAllSelected = computed(() => {
  return (
    eventStore.pendingEvents.length > 0 &&
    eventStore.selectedPendingEventIds.length === eventStore.pendingEvents.length
  )
})

function toggleSelectAll() {
  if (isAllSelected.value) {
    eventStore.selectedPendingEventIds = []
  } else {
    eventStore.selectedPendingEventIds = eventStore.pendingEvents.map((event) => event.id)
  }
}

function toggleEventSelection(eventId) {
  const ids = eventStore.selectedPendingEventIds
  if (ids.includes(eventId)) {
    eventStore.selectedPendingEventIds = ids.filter((id) => id !== eventId)
  } else {
    eventStore.selectedPendingEventIds = [...ids, eventId]
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

function getShortLocation(address) {
  if (!address) return ''
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 3) {
    const neighborhood = parts[1]
    const city = parts[2]
    const state = parts[3] || ''
    return state ? `${neighborhood}, ${city} - ${state}` : `${neighborhood}, ${city}`
  }
  return address.length > 40 ? `${address.slice(0, 40)}…` : address
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

async function submitNewAdmin() {
  const id = newAdminUuid.value.trim()
  if (!id) return
  const result = await eventStore.addAdminUser(id)
  if (result?.success) {
    newAdminUuid.value = ''
  }
}

onMounted(() => {
  eventStore.fetchPendingEvents()
})
</script>

<template>
  <div class="admin-overlay">
    <header class="admin-header">
      <h1 class="admin-title">Admin CMS</h1>
      <button
        type="button"
        class="btn-close"
        aria-label="Close admin panel"
        @click="uiStore.closeAdminPanel()"
      >
        <PhX :size="20" weight="bold" />
      </button>
    </header>

    <nav class="admin-tabs">
      <button
        type="button"
        class="admin-tab"
        :class="{ 'admin-tab--active': activeTab === 'pending' }"
        @click="activeTab = 'pending'"
      >
        Eventos Pendentes
      </button>
      <button
        v-if="authStore.isSuperAdmin"
        type="button"
        class="admin-tab"
        :class="{ 'admin-tab--active': activeTab === 'admins' }"
        @click="activeTab = 'admins'"
      >
        Gestão de Admins
      </button>
    </nav>

    <section v-if="activeTab === 'pending'" class="admin-tab-content">
      <div class="admin-toolbar">
        <label class="select-all">
          <input
            type="checkbox"
            class="admin-checkbox"
            :checked="isAllSelected"
            @change="toggleSelectAll()"
          />
          <span>Selecionar Todos</span>
        </label>
        <div class="admin-toolbar__actions">
          <button
            type="button"
            class="btn-approve"
            :disabled="eventStore.selectedPendingEventIds.length === 0"
            @click="eventStore.bulkUpdatePendingEvents('approved')"
          >
            <PhCheck :size="16" weight="bold" />
            Aprovar
          </button>
          <button
            type="button"
            class="btn-reject"
            :disabled="eventStore.selectedPendingEventIds.length === 0"
            @click="eventStore.bulkUpdatePendingEvents('rejected')"
          >
            Rejeitar
          </button>
        </div>
      </div>

      <p v-if="eventStore.isLoading" class="admin-state">Carregando...</p>
      <p
        v-else-if="eventStore.pendingEvents.length === 0"
        class="admin-state"
      >
        Nenhum evento pendente. A paz reina.
      </p>

      <div v-else class="admin-grid">
        <article
          v-for="event in eventStore.pendingEvents"
          :key="event.id"
          class="admin-card"
        >
          <input
            type="checkbox"
            class="admin-card__checkbox"
            :checked="eventStore.selectedPendingEventIds.includes(event.id)"
            @change="toggleEventSelection(event.id)"
          />
          <h3 class="admin-card__title">{{ event.title }}</h3>
          <p class="admin-card__meta">{{ formatDate(event.start_date) }}</p>
          <p class="admin-card__meta">{{ getShortLocation(event.location) }}</p>

          <div
            v-if="parsePills(event.genres).length"
            class="admin-card__tags"
          >
            <span
              v-for="(pill, index) in parsePills(event.genres)"
              :key="`genre-${index}`"
              class="admin-tag"
              :style="{ backgroundColor: pill?.COLOR || pill?.color || '#e5e7eb' }"
            >
              {{ pill?.LABEL || pill?.label || pill }}
            </span>
          </div>
          <div
            v-if="parsePills(event.lineup).length"
            class="admin-card__tags"
          >
            <span
              v-for="(pill, index) in parsePills(event.lineup)"
              :key="`lineup-${index}`"
              class="admin-tag"
              :style="{ backgroundColor: pill?.COLOR || pill?.color || '#e5e7eb' }"
            >
              {{ pill?.LABEL || pill?.label || pill }}
            </span>
          </div>
        </article>
      </div>
    </section>

    <section v-else-if="activeTab === 'admins'" class="admin-tab-content">
      <form class="admin-form" @submit.prevent="submitNewAdmin()">
        <div class="float-wrap">
          <input
            v-model="newAdminUuid"
            type="text"
            class="float-input"
            placeholder=" "
          />
          <label class="float-label">UUID do Novo Admin</label>
        </div>
        <button type="submit" class="btn-submit">
          <PhCheck :size="16" weight="bold" />
          Adicionar Admin
        </button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.admin-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background-color: var(--surface-color, #fff);
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 4px solid var(--border-color, #000);
  padding-bottom: 16px;
}

.admin-title {
  font-size: 1.5rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--bg-color, #fff);
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
  color: var(--text-color, #000);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.admin-tabs {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.admin-tab {
  padding: 8px 16px;
  border: 2px solid var(--border-color, #000);
  background: transparent;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1rem;
  border-radius: var(--radius-md);
  color: var(--text-color, #000);
  text-transform: uppercase;
  -webkit-tap-highlight-color: transparent;
}

.admin-tab--active {
  background-color: var(--border-color, #000);
  color: white;
  box-shadow: var(--shadow-1);
}

.admin-tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f3f4f6;
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.admin-toolbar__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 900;
  text-transform: uppercase;
  cursor: pointer;
}

.admin-checkbox {
  width: 20px;
  height: 20px;
  accent-color: var(--accent-color);
  cursor: pointer;
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.admin-card {
  border: 2px solid var(--border-color, #000);
  padding: 16px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
  background: white;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-card__checkbox {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  accent-color: var(--accent-color);
  cursor: pointer;
}

.admin-card__title {
  font-size: 1rem;
  font-weight: 900;
  text-transform: uppercase;
  padding-right: 32px;
}

.admin-card__meta {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted, #555);
}

.admin-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.admin-tag {
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 900;
  color: #000000;
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
}

.admin-state {
  padding: 16px;
  font-size: 0.875rem;
  font-weight: 900;
  text-transform: uppercase;
  text-align: center;
  background: var(--bg-color, #fff);
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
}

.btn-approve,
.btn-reject,
.btn-submit {
  padding: 8px 16px;
  font-weight: bold;
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  cursor: pointer;
  box-shadow: 2px 2px 0px 0px var(--border-color, #000);
  color: #000000;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  font-size: 0.875rem;
  -webkit-tap-highlight-color: transparent;
}

.btn-approve {
  background-color: #a3e635;
}

.btn-reject {
  background-color: #fb923c;
}

.btn-submit {
  background-color: var(--accent-color, #a3e635);
}

.btn-approve:disabled,
.btn-reject:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 420px;
}

.float-wrap {
  position: relative;
}

.float-input {
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
  transition: box-shadow 0.15s ease;
}

.float-input:focus {
  box-shadow: var(--shadow-1);
}

.float-label {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-muted, #555);
  pointer-events: none;
  transition: all 0.15s ease;
}

.float-input:focus + .float-label,
.float-input:not(:placeholder-shown) + .float-label {
  top: 6px;
  transform: translateY(0) scale(0.7);
  transform-origin: left center;
  color: var(--text-color, #000);
}
</style>
