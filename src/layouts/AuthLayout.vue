<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
const isWide = computed(() => route.name === 'register')
</script>

<template>
  <div class="auth-shell">
    <main class="auth-main">
      <div :class="['auth-header', { 'auth-header--wide': isWide }]">
        <h1>Bank App</h1>
        <p>Sign in to continue.</p>
      </div>
      <div :class="['auth-panel', { 'auth-panel--wide': isWide }]">
        <RouterView />
      </div>
    </main>
  </div>
</template>
