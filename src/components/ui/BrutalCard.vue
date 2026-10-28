<script setup>
// Reusable Neo-Brutalist container.
</script>

<template>
  <div
    v-motion
    class="brutal-card"
    :initial="{ scale: 1 }"
    :enter="{ scale: 1, transition: { type: 'spring', stiffness: 400, damping: 20 } }"
    :tapped="{ scale: 0.94, transition: { type: 'spring', stiffness: 400, damping: 20 } }"
  >
    <slot />
  </div>
</template>

<style scoped>
.brutal-card {
  background-color: var(--surface-color);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-2);
  padding: var(--space-4);
}
</style>
