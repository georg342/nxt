<script setup>
import { onMounted } from 'vue'
import { PhCheck, PhX } from '@phosphor-icons/vue'
import BrutalButton from '../ui/BrutalButton.vue'
import { useEventStore } from '../../stores/eventStore'

const eventStore = useEventStore()

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

    <p v-if="eventStore.isLoading" class="admin-panel__state">Carregando...</p>
    <p v-else-if="eventStore.pendingEvents.length === 0" class="admin-panel__state">
      Nenhum evento pendente. A paz reina.
    </p>

    <div v-else class="admin-panel__grid">
      <article
        v-for="event in eventStore.pendingEvents"
        :key="event.id"
        class="admin-panel__card"
      >
        <h3 class="admin-panel__card-title">{{ event.title }}</h3>
        <p class="admin-panel__card-meta">{{ formatDate(event.start_date) }}</p>
        <p class="admin-panel__card-meta">{{ event.location }}</p>

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
</style>
