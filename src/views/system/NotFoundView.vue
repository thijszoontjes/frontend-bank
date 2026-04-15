<template>
  <main class="not-found">
    <div class="card card-body not-found-card">
      <AppBadge variant="warning">404</AppBadge>
      <h1 style="margin: 1rem 0 0;">Page not found</h1>
      <p style="margin: 0.75rem 0 1.5rem; color: var(--color-text-muted); line-height: 1.7;">
        The route does not exist in the current SPA configuration. Use the router structure to add new views in a
        predictable way.
      </p>
      <div class="button-group" style="justify-content: center;">
        <RouterLink class="app-button app-button--primary" to="/dashboard">Go to dashboard</RouterLink>
        <RouterLink class="app-button app-button--secondary" to="/login">Go to login</RouterLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import AppBadge from '@/components/ui/AppBadge.vue'
</script>
