<script setup>
import { computed, onMounted, ref } from 'vue'
import { PhX } from '@phosphor-icons/vue'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { useEventStore } from '../../stores/eventStore'

const uiStore = useUIStore()
const authStore = useAuthStore()
const eventStore = useEventStore()

const activeTab = ref('pending')
const newAdminId = ref('')

const allSelected = computed(() => {
  const ids = eventStore.pendingEvents.map((event) => event.id)
  return ids.length > 0 && ids.every((id) => eventStore.selectedPendingEventIds.includes(id))
})

function toggleSelectAll() {
  if (allSelected.value) {
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

function parsePills(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

async function handleAddAdmin() {
  const id = newAdminId.value.trim()
  if (!id) return
  const result = await eventStore.addAdminUser(id)
  if (result?.success) {
    newAdminId.value = ''
  }
}

onMounted(() => {
  eventStore.fetchPendingEvents()
})
</script>

<template>
  <div class="admin-gateway">
    <header class="admin-gateway__header">
      <h1 class="admin-gateway__title">Admin CMS</h1>
      <button
        type="button"
        class="admin-gateway__close"
        aria-label="Close admin panel"
        @click="uiStore.closeAdminPanel()"
      >
        <PhX :size="20" weight="bold" />
      </button>
    </header>

    <nav class="admin-gateway__tabs">
      <button
        type="button"
        class="admin-gateway__tab"
        :class="{ 'admin-gateway__tab--active': activeTab === 'pending' }"
        @click="activeTab = 'pending'"
      >
        Eventos Pendentes
      </button>
      <button
        v-if="authStore.isSuperAdmin"
        type="button"
        class="admin-gateway__tab"
        :class="{ 'admin-gateway__tab--active': activeTab === 'admins' }"
        @click="activeTab = 'admins'"
      >
        Gestão de Admins
      </button>
    </nav>

    <section v-if="activeTab === 'pending'" class="admin-gateway__section">
      <div class="admin-gateway__toolbar">
        <label class="admin-gateway__select-all">
          <input
            type="checkbox"
            class="admin-gateway__checkbox"
            :checked="allSelected"
            @change="toggleSelectAll()"
          />
          Selecionar Todos
        </label>
        <button
          type="button"
          class="admin-gateway__bulk admin-gateway__bulk--approve"
          :disabled="eventStore.selectedPendingEventIds.length === 0"
          @click="eventStore.bulkUpdatePendingEvents('published')"
        >
          Aprovar Selecionados
        </button>
        <button
          type="button"
          class="admin-gateway__bulk admin-gateway__bulk--reject"
          :disabled="eventStore.selectedPendingEventIds.length === 0"
          @click="eventStore.bulkUpdatePendingEvents('rejected')"
        >
          Rejeitar Selecionados
        </button>
      </div>

      <p v-if="eventStore.isLoading" class="admin-gateway__state">Carregando...</p>
      <p
        v-else-if="eventStore.pendingEvents.length === 0"
        class="admin-gateway__state"
      >
        Nenhum evento pendente. A paz reina.
      </p>

      <div v-else class="admin-gateway__grid">
        <article
          v-for="event in eventStore.pendingEvents"
          :key="event.id"
          class="admin-gateway__card"
        >
          <label class="admin-gateway__card-head">
            <input
              type="checkbox"
              class="admin-gateway__checkbox"
              :checked="eventStore.selectedPendingEventIds.includes(event.id)"
              @change="toggleEventSelection(event.id)"
            />
            <span class="admin-gateway__card-title">{{ event.title }}</span>
          </label>
          <p class="admin-gateway__card-meta">{{ formatDate(event.start_date) }}</p>
          <p class="admin-gateway__card-meta">{{ event.location }}</p>
          <div
            v-if="parsePills(event.genres).length"
            class="admin-gateway__tags"
          >
            <span
              v-for="(pill, index) in parsePills(event.genres)"
              :key="`genre-${index}`"
              class="admin-gateway__tag"
              :style="{ backgroundColor: pill.color || pill.COLOR }"
            >
              {{ pill.label || pill.LABEL }}
            </span>
          </div>
          <div
            v-if="parsePills(event.lineup).length"
            class="admin-gateway__tags"
          >
            <span
              v-for="(pill, index) in parsePills(event.lineup)"
              :key="`lineup-${index}`"
              class="admin-gateway__tag"
              :style="{ backgroundColor: pill.color || pill.COLOR }"
            >
              {{ pill.label || pill.LABEL }}
            </span>
          </div>
        </article>
      </div>
    </section>

    <section v-else-if="activeTab === 'admins'" class="admin-gateway__section">
      <form class="admin-gateway__form" @submit.prevent="handleAddAdmin()">
        <div class="admin-gateway__field-wrap">
          <input
            v-model="newAdminId"
            type="text"
            class="admin-gateway__input"
            placeholder=" "
          />
          <label class="admin-gateway__label">UUID do Novo Admin</label>
        </div>
        <button type="submit" class="admin-gateway__submit">
          Adicionar Admin
        </button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.admin-gateway {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: 24px;
  background: var(--surface-color);
  overflow-y: auto;
}

.admin-gateway__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.admin-gateway__title {
  font-size: 1.5rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.admin-gateway__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
  color: var(--text-color);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.admin-gateway__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.admin-gateway__tab {
  padding: var(--space-2) var(--space-4);
  font-size: 0.875rem;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-color);
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.admin-gateway__tab--active {
  background: #a3e635;
  color: #000000;
}

.admin-gateway__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-gateway__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.admin-gateway__select-all {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
}

.admin-gateway__checkbox {
  width: 20px;
  height: 20px;
  accent-color: var(--accent-color);
  cursor: pointer;
}

.admin-gateway__bulk {
  padding: var(--space-2) var(--space-4);
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  color: #000000;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.admin-gateway__bulk:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.admin-gateway__bulk--approve {
  background: #a3e635;
}

.admin-gateway__bulk--reject {
  background: #fb923c;
}

.admin-gateway__state {
  padding: var(--space-4);
  font-size: 0.875rem;
  font-weight: 900;
  text-transform: uppercase;
  text-align: center;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
}

.admin-gateway__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.admin-gateway__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-1);
}

.admin-gateway__card-head {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.admin-gateway__card-title {
  font-size: 1rem;
  font-weight: 900;
  text-transform: uppercase;
}

.admin-gateway__card-meta {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
}

.admin-gateway__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.admin-gateway__tag {
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 900;
  color: #000000;
  background: #22d3ee;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
}

.admin-gateway__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 420px;
}

.admin-gateway__field-wrap {
  position: relative;
}

.admin-gateway__input {
  width: 100%;
  padding: 26px 12px 8px;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-color);
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  outline: none;
  transition: box-shadow 0.15s ease;
}

.admin-gateway__input:focus {
  box-shadow: var(--shadow-1);
}

.admin-gateway__label {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-muted);
  pointer-events: none;
  transition: all 0.15s ease;
}

.admin-gateway__input:focus + .admin-gateway__label,
.admin-gateway__input:not(:placeholder-shown) + .admin-gateway__label {
  top: 6px;
  transform: translateY(0) scale(0.7);
  transform-origin: left center;
  color: var(--text-color);
}

.admin-gateway__submit {
  padding: var(--space-2) var(--space-4);
  font-size: 0.875rem;
  font-weight: 900;
  text-transform: uppercase;
  color: #000000;
  background: #a3e635;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
</style>
