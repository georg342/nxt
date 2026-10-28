<script setup>
import { ref } from 'vue'
import { PhMagnifyingGlass } from '@phosphor-icons/vue'
import EventCard from './EventCard.vue'
import { useUIStore } from '../../stores/uiStore'

const uiStore = useUIStore()
const expandedEventId = ref(null)

function toggleEvent(id) {
  expandedEventId.value = expandedEventId.value === id ? null : id
}
</script>

<template>
  <div class="search-results">
    <div
      v-if="uiStore.hasSearchQuery && !uiStore.hasMinSearchLength"
      class="search-results__hint"
    >
      <PhMagnifyingGlass :size="32" weight="duotone" />
      <p>{{ $t('search.hint') }}</p>
    </div>

    <div
      v-else-if="uiStore.hasMinSearchLength && uiStore.searchResults.length === 0"
      class="search-results__hint"
    >
      <PhMagnifyingGlass :size="32" weight="duotone" />
      <p>{{ $t('search.empty') }}</p>
    </div>

    <EventCard
      v-for="event in uiStore.searchResults"
      v-else
      :key="event.id"
      :event="event"
      :expanded="expandedEventId === event.id"
      @toggle="toggleEvent(event.id)"
    />
  </div>
</template>

<style scoped>
.search-results {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  gap: 16px;
  padding: 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  box-sizing: border-box;
}

.search-results::-webkit-scrollbar {
  display: none;
}

.search-results__hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-4);
  color: var(--text-muted);
  font-weight: 700;
  text-align: center;
}
</style>
