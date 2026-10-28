<script setup>
// Temporary placeholder view for setup validation.
</script>

<template>
  <main class="home-view">
    <h1 class="home-view__title">WNXT</h1>
  </main>
</template>

<style scoped>
.home-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: var(--space-4);
}

.home-view__title {
  font-size: clamp(2.5rem, 12vw, 6rem);
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: var(--space-4) var(--space-6);
  background-color: var(--accent-color);
  color: var(--accent-contrast);
  border: var(--border-width-strong) solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-2);
}
</style>
