<script setup>
import AppHeader from './AppHeader.vue'
</script>

<template>
  <div class="app-layout">
    <AppHeader />
    <main class="app-layout__main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-layout__main {
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>
