<script setup>
import AppLayout from '../components/layout/AppLayout.vue'
import BrutalCard from '../components/ui/BrutalCard.vue'
</script>

<template>
  <AppLayout>
    <div class="home-view">
      <BrutalCard>
        <h1 class="home-view__title">WNXT</h1>
        <p class="home-view__text">
          Electronic music event calendar. Layout foundation ready.
        </p>
      </BrutalCard>
    </div>
  </AppLayout>
</template>

<style scoped>
.home-view {
  height: 100%;
  overflow-y: auto;
  padding: var(--space-4);
}

.home-view__title {
  font-size: clamp(2rem, 8vw, 3.5rem);
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: var(--space-2);
}

.home-view__text {
  color: var(--text-muted);
  font-size: 0.95rem;
}
</style>
