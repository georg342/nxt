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

function tagLabel(tag) {
  return typeof tag === 'string' ? tag : tag?.label ?? ''
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
  <div class="fixed inset-0 z-50 bg-[var(--surface-color)] overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
    <header class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-black uppercase tracking-wide">Admin CMS</h1>
      <button
        type="button"
        class="w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-gray-200 shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer rounded-md"
        aria-label="Close admin panel"
        @click="uiStore.closeAdminPanel()"
      >
        <PhX :size="20" weight="bold" />
      </button>
    </header>

    <nav class="flex gap-2 flex-wrap">
      <button
        type="button"
        class="px-4 py-2 font-black uppercase text-sm border-2 border-black rounded-md shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
        :class="activeTab === 'pending' ? 'bg-[#a3e635]' : 'bg-white'"
        @click="activeTab = 'pending'"
      >
        Eventos Pendentes
      </button>
      <button
        v-if="authStore.isSuperAdmin"
        type="button"
        class="px-4 py-2 font-black uppercase text-sm border-2 border-black rounded-md shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer"
        :class="activeTab === 'admins' ? 'bg-[#22d3ee]' : 'bg-white'"
        @click="activeTab = 'admins'"
      >
        Gestão de Admins
      </button>
    </nav>

    <section v-if="activeTab === 'pending'" class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 font-black uppercase text-xs">
          <input
            type="checkbox"
            class="w-5 h-5 border-2 border-black"
            :checked="allSelected"
            @change="toggleSelectAll()"
          />
          Selecionar Todos
        </label>
        <button
          type="button"
          class="px-4 py-2 font-black uppercase text-xs border-2 border-black rounded-md shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-[#a3e635] cursor-pointer disabled:opacity-50"
          :disabled="eventStore.selectedPendingEventIds.length === 0"
          @click="eventStore.bulkUpdatePendingEvents('published')"
        >
          Aprovar Selecionados
        </button>
        <button
          type="button"
          class="px-4 py-2 font-black uppercase text-xs border-2 border-black rounded-md shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-[#fb923c] cursor-pointer disabled:opacity-50"
          :disabled="eventStore.selectedPendingEventIds.length === 0"
          @click="eventStore.bulkUpdatePendingEvents('rejected')"
        >
          Rejeitar Selecionados
        </button>
      </div>

      <p v-if="eventStore.isLoading" class="font-black uppercase text-sm">Carregando...</p>
      <p
        v-else-if="eventStore.pendingEvents.length === 0"
        class="font-black uppercase text-sm p-4 border-2 border-black rounded-md bg-white"
      >
        Nenhum evento pendente. A paz reina.
      </p>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article
          v-for="event in eventStore.pendingEvents"
          :key="event.id"
          class="flex flex-col gap-2 p-4 bg-white border-2 border-black rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
        >
          <label class="flex items-start gap-2">
            <input
              type="checkbox"
              class="w-5 h-5 border-2 border-black mt-1"
              :checked="eventStore.selectedPendingEventIds.includes(event.id)"
              @change="toggleEventSelection(event.id)"
            />
            <span class="text-base font-black uppercase">{{ event.title }}</span>
          </label>
          <p class="text-xs font-bold text-gray-600">{{ formatDate(event.start_date) }}</p>
          <p class="text-xs font-bold text-gray-600">{{ event.location }}</p>
          <div v-if="event.lineup?.length" class="flex flex-wrap gap-1">
            <span
              v-for="(member, index) in event.lineup"
              :key="`lineup-${index}`"
              class="px-2 py-1 text-xs font-black bg-[#22d3ee] border-2 border-black rounded-md"
            >
              {{ tagLabel(member) }}
            </span>
          </div>
        </article>
      </div>
    </section>

    <section v-else-if="activeTab === 'admins'" class="flex flex-col gap-4 max-w-md">
      <form class="flex flex-col gap-3" @submit.prevent="handleAddAdmin()">
        <div class="relative">
          <input
            v-model="newAdminId"
            type="text"
            class="peer w-full px-3 pt-6 pb-2 text-sm font-bold bg-white border-2 border-black rounded-md outline-none"
            placeholder=" "
          />
          <label
            class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 pointer-events-none transition-all peer-focus:top-2 peer-focus:translate-y-0 peer-focus:scale-75 peer-focus:origin-left peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:origin-left"
          >
            UUID do Novo Admin
          </label>
        </div>
        <button
          type="submit"
          class="px-4 py-2 font-black uppercase text-sm border-2 border-black rounded-md shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-[#a3e635] cursor-pointer"
        >
          Adicionar Admin
        </button>
      </form>
    </section>
  </div>
</template>
