<script setup>
// Temporary placeholder view for setup validation.
</script>

<template>
  <main class="admin-gateway-view">
    <h1 class="admin-gateway-view__title">Admin Gateway</h1>
  </main>
</template>

<style scoped>
.admin-gateway-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: var(--space-4);
}

.admin-gateway-view__title {
  font-size: clamp(2rem, 8vw, 4rem);
  font-weight: 900;
  text-transform: uppercase;
  padding: var(--space-4) var(--space-6);
  background-color: var(--surface-color);
  color: var(--text-color);
  border: var(--border-width-strong) solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-2);
}
</style>
