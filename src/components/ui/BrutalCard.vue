<script setup>
// Reusable Neo-Brutalist container.
</script>

<template>
  <div
    v-motion
    class="brutal-card"
    :tapped="{ scale: 0.98 }"
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
