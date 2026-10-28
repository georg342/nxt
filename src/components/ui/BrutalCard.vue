<script setup>
// Reusable Neo-Brutalist container.
</script>

<template>
  <div class="brutal-card">
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
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
</style>
