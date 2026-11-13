import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const MIN_SEARCH_LENGTH = 3

export const useUIStore = defineStore(
  'ui',
  () => {
    const searchQuery = ref('')
    const isSearchOpen = ref(false)
    const isCreateEventModalOpen = ref(false)
    const editingEvent = ref(null)
    const isAdminPanelOpen = ref(false)
    const toast = ref({ show: false, message: '', type: 'success' })
    let toastTimeoutId = null

    const normalizedSearchQuery = computed(() =>
      searchQuery.value.trim().toLowerCase()
    )

    const hasSearchQuery = computed(
      () => normalizedSearchQuery.value.length > 0
    )

    const hasMinSearchLength = computed(
      () => normalizedSearchQuery.value.length >= MIN_SEARCH_LENGTH
    )

    /**
     * Opens the search field.
     */
    function openSearch() {
      isSearchOpen.value = true
    }

    /**
     * Closes the search field and clears the query.
     */
    function closeSearch() {
      isSearchOpen.value = false
      searchQuery.value = ''
    }

    /**
     * Toggles the search field visibility.
     */
    function toggleSearch() {
      if (isSearchOpen.value) {
        closeSearch()
      } else {
        openSearch()
      }
    }

    /**
     * Shows a toast notification, replacing any active one.
     * @param {string} message
     * @param {'success' | 'error' | 'info'} [type]
     * @param {number} [duration]
     */
    function showToast(message, type = 'success', duration = 3000) {
      if (toastTimeoutId) {
        clearTimeout(toastTimeoutId)
        toastTimeoutId = null
      }

      toast.value = { show: true, message, type }

      toastTimeoutId = setTimeout(() => {
        toast.value = { ...toast.value, show: false }
        toastTimeoutId = null
      }, duration)
    }

    /**
     * Hides the toast notification immediately.
     */
    function hideToast() {
      if (toastTimeoutId) {
        clearTimeout(toastTimeoutId)
        toastTimeoutId = null
      }
      toast.value = { ...toast.value, show: false }
    }

    /**
     * Opens the create event modal.
     */
    function openCreateEventModal() {
      isCreateEventModalOpen.value = true
    }

    /**
     * Closes the create event modal.
     */
    function closeCreateEventModal() {
      isCreateEventModalOpen.value = false
    }

    /**
     * Stages an event for editing; CreateEventModal reads this to switch modes.
     * @param {Object|null} event
     */
    function startEditing(event) {
      editingEvent.value = event
    }

    /**
     * Clears the staged event, returning the modal to creation mode.
     */
    function cancelEditing() {
      editingEvent.value = null
    }

    /**
     * Opens the admin CMS panel.
     */
    function openAdminPanel() {
      isAdminPanelOpen.value = true
    }

    /**
     * Toggles the admin CMS panel visibility.
     */
    function toggleAdminPanel() {
      isAdminPanelOpen.value = !isAdminPanelOpen.value
    }

    /**
     * Closes the admin CMS panel.
     */
    function closeAdminPanel() {
      isAdminPanelOpen.value = false
    }

    return {
      searchQuery,
      isSearchOpen,
      isCreateEventModalOpen,
      editingEvent,
      isAdminPanelOpen,
      toast,
      hasSearchQuery,
      hasMinSearchLength,
      openSearch,
      closeSearch,
      toggleSearch,
      openCreateEventModal,
      closeCreateEventModal,
      startEditing,
      cancelEditing,
      openAdminPanel,
      closeAdminPanel,
      toggleAdminPanel,
      showToast,
      hideToast,
    }
  }
)
