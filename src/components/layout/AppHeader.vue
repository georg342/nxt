<script setup>
import { useRouter } from 'vue-router'
import BrutalButton from '../ui/BrutalButton.vue'

const router = useRouter()

function goToAdmin() {
  router.push('/admin')
}
</script>

<template>
  <header class="app-header">
    <span
      class="app-header__logo"
      @dblclick="goToAdmin"
    >
      WNXT
    </span>

    <nav class="app-header__nav">
      <BrutalButton>12M</BrutalButton>
      <BrutalButton>30D</BrutalButton>
      <BrutalButton>7D</BrutalButton>
      <BrutalButton>Today</BrutalButton>
      <BrutalButton color="var(--accent-color)">+</BrutalButton>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--surface-color);
  border-bottom: var(--border-width-strong) solid var(--border-color);
  flex-shrink: 0;
}

.app-header__logo {
  font-weight: 900;
  font-size: 1.25rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  user-select: none;
  cursor: pointer;
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 12px;
  padding-right: 12px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.app-header__nav::-webkit-scrollbar {
  display: none;
}
</style>
