<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useGenreStore } from '../../stores/genreStore'

const DEFAULT_GENRE_COLOR = '#FACC15'

const genreStore = useGenreStore()

function emptyForm() {
  return { name: '', slug: '', parent_id: null, color: DEFAULT_GENRE_COLOR }
}

const form = ref(emptyForm())
const editingId = ref(null)
const initialName = ref('')
const pendingDeleteId = ref(null)

const isChild = computed(() => Boolean(form.value.parent_id))

const editingHasChildren = computed(() =>
  genreStore.genres.some((genre) => genre.parent_id === editingId.value)
)

// A genre with children can't become a child itself (DB enforces 1 level).
const parentOptions = computed(() =>
  genreStore.parentGenres.filter(
    (genre) => !(genre.id === editingId.value && editingHasChildren.value)
  )
)

const groupedGenres = computed(() =>
  genreStore.parentGenres.map((parent) => ({
    ...parent,
    displayColor: genreStore.getGenreDisplay(parent.id).color,
    children: genreStore.genres
      .filter((genre) => genre.parent_id === parent.id)
      .map((child) => ({
        ...child,
        displayColor: genreStore.getGenreDisplay(child.id).color,
      })),
  }))
)

function slugify(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

watch(
  () => form.value.name,
  (name) => {
    // Keeps the stored slug intact until the name actually changes.
    if (name === initialName.value) return
    form.value.slug = slugify(name)
  }
)

function startEdit(genre) {
  editingId.value = genre.id
  initialName.value = genre.name ?? ''
  pendingDeleteId.value = null
  form.value = {
    name: genre.name ?? '',
    slug: genre.slug ?? slugify(genre.name),
    parent_id: genre.parent_id ?? null,
    color: genre.color ?? DEFAULT_GENRE_COLOR,
  }
}

function resetForm() {
  editingId.value = null
  initialName.value = ''
  pendingDeleteId.value = null
  form.value = emptyForm()
}

async function handleSubmit() {
  const name = form.value.name.trim()
  if (!name) return

  const payload = {
    name,
    slug: form.value.slug || slugify(name),
    parent_id: form.value.parent_id || null,
    color: form.value.color || DEFAULT_GENRE_COLOR,
  }

  try {
    if (editingId.value) await genreStore.updateGenre(editingId.value, payload)
    else await genreStore.addGenre(payload)
    resetForm()
  } catch {
    // genreStore.error feeds the inline message below
  }
}

async function requestDelete(id) {
  if (pendingDeleteId.value !== id) {
    pendingDeleteId.value = id
    return
  }

  pendingDeleteId.value = null
  if (editingId.value === id) resetForm()

  try {
    await genreStore.removeGenre(id)
  } catch {
    // genreStore.error feeds the inline message below
  }
}

onMounted(() => {
  if (genreStore.genres.length === 0) genreStore.loadGenres()
})
</script>

<template>
  <section class="genres-manager">
    <form class="genres-form" @submit.prevent="handleSubmit">
      <h2 class="genres-form__title">
        {{ editingId ? 'Editar Gênero' : 'Novo Gênero' }}
      </h2>

      <div class="genres-form__grid">
        <label class="genres-field">
          <span>Nome</span>
          <input v-model="form.name" type="text" class="genres-input" required />
        </label>

        <label class="genres-field">
          <span>Slug</span>
          <input
            :value="form.slug"
            type="text"
            class="genres-input genres-input--readonly"
            readonly
          />
        </label>

        <label class="genres-field">
          <span>Gênero Pai</span>
          <select v-model="form.parent_id" class="genres-input">
            <option :value="null">Nenhum (Gênero Principal / Pai)</option>
            <option
              v-for="option in parentOptions"
              :key="option.id"
              :value="option.id"
            >
              {{ option.name }}
            </option>
          </select>
        </label>

        <div class="genres-field" :class="{ 'genres-field--muted': isChild }">
          <span>Cor{{ isChild ? ' (herdada do pai)' : '' }}</span>
          <div class="genres-color-row">
            <input
              v-model="form.color"
              type="color"
              class="genres-color"
              :disabled="isChild"
            />
            <input
              v-model="form.color"
              type="text"
              class="genres-input genres-input--hex"
              pattern="#[0-9a-fA-F]{6}"
              :required="!isChild"
              :disabled="isChild"
            />
          </div>
        </div>
      </div>

      <div class="genres-form__actions">
        <button
          type="submit"
          class="genre-btn genre-btn--primary"
          :disabled="genreStore.isLoading"
        >
          {{ editingId ? 'Salvar Alterações' : 'Criar Gênero' }}
        </button>
        <button
          v-if="editingId"
          type="button"
          class="genre-btn"
          @click="resetForm"
        >
          Cancelar
        </button>
      </div>

      <p v-if="genreStore.error" class="genres-error">
        {{ genreStore.error }}
      </p>
    </form>

    <div class="genres-list">
      <p v-if="genreStore.isLoading && !groupedGenres.length" class="genres-state">
        Carregando...
      </p>
      <p v-else-if="!groupedGenres.length" class="genres-state">
        Nenhum gênero cadastrado.
      </p>

      <article
        v-for="parent in groupedGenres"
        :key="parent.id"
        class="genre-card"
      >
        <header class="genre-card__head">
          <div class="genre-card__identity">
            <span
              class="genre-swatch"
              :style="{ backgroundColor: parent.displayColor }"
            ></span>
            <div>
              <strong class="genre-card__name">{{ parent.name }}</strong>
              <span class="genre-card__slug">{{ parent.slug }}</span>
            </div>
          </div>
          <div class="genre-card__actions">
            <button
              type="button"
              class="genre-btn genre-btn--edit"
              @click="startEdit(parent)"
            >
              Editar
            </button>
            <button
              type="button"
              class="genre-btn genre-btn--delete"
              @click="requestDelete(parent.id)"
            >
              {{ pendingDeleteId === parent.id ? 'Confirmar?' : 'Excluir' }}
            </button>
          </div>
        </header>

        <ul v-if="parent.children.length" class="genre-children">
          <li
            v-for="child in parent.children"
            :key="child.id"
            class="genre-child"
          >
            <div class="genre-card__identity">
              <span
                class="genre-swatch genre-swatch--child"
                :style="{ backgroundColor: child.displayColor }"
              ></span>
              <div>
                <strong class="genre-child__name">{{ child.name }}</strong>
                <span class="genre-card__slug">{{ child.slug }}</span>
              </div>
            </div>
            <div class="genre-card__actions">
              <button
                type="button"
                class="genre-btn genre-btn--edit"
                @click="startEdit(child)"
              >
                Editar
              </button>
              <button
                type="button"
                class="genre-btn genre-btn--delete"
                @click="requestDelete(child.id)"
              >
                {{ pendingDeleteId === child.id ? 'Confirmar?' : 'Excluir' }}
              </button>
            </div>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<style scoped>
.genres-manager {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ============================================================
   FORM
   ============================================================ */
.genres-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--surface-color, #fff);
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1, 4px 4px 0 0 #000);
}

.genres-form__title {
  font-size: 0.875rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.genres-form__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.genres-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
}

.genres-field--muted {
  opacity: 0.6;
}

.genres-input {
  width: 100%;
  padding: 8px 10px;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: none;
  color: var(--text-color, #000);
  background: var(--bg-color, #fff);
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  outline: none;
}

.genres-input:focus {
  box-shadow: var(--shadow-1, 4px 4px 0 0 #000);
}

.genres-input--readonly {
  color: var(--text-muted, #555);
}

.genres-color-row {
  display: flex;
  gap: 8px;
}

.genres-color {
  width: 46px;
  height: 36px;
  padding: 2px;
  background: var(--bg-color, #fff);
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.genres-input--hex {
  flex: 1;
  text-transform: uppercase;
}

.genres-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.genres-error {
  font-size: 0.75rem;
  font-weight: 700;
  color: #991b1b;
}

/* ============================================================
   LIST
   ============================================================ */
.genres-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.genres-state {
  padding: 24px;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 900;
  text-transform: uppercase;
  background: var(--surface-color, #fff);
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
}

.genre-card {
  background: var(--surface-color, #fff);
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-1, 4px 4px 0 0 #000);
  overflow: hidden;
}

.genre-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
}

.genre-card__identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.genre-swatch {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color, #000);
  border-radius: 4px;
}

.genre-swatch--child {
  width: 16px;
  height: 16px;
}

.genre-card__name {
  display: block;
  font-size: 0.8125rem;
  font-weight: 900;
  text-transform: uppercase;
}

.genre-child__name {
  display: block;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
}

.genre-card__slug {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted, #555);
}

.genre-card__actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.genre-children {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 2px dashed var(--border-color, #000);
}

.genre-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 16px 8px 32px;
}

.genre-child + .genre-child {
  border-top: 1px solid rgba(0, 0, 0, 0.15);
}

/* ============================================================
   BUTTONS (local: parent scoped styles don't reach children)
   ============================================================ */
.genre-btn {
  padding: 6px 12px;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 900;
  text-transform: uppercase;
  color: #000;
  background: #e5e7eb;
  border: 2px solid var(--border-color, #000);
  border-radius: var(--radius-md);
  box-shadow: 2px 2px 0 0 var(--border-color, #000);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.genre-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.genre-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.genre-btn--primary {
  background: #a3e635;
}

.genre-btn--edit {
  background: #60a5fa;
}

.genre-btn--delete {
  color: #fff;
  background: #ef4444;
}

@media (max-width: 768px) {
  .genre-child {
    padding-left: 16px;
  }
}
</style>
