<script setup lang="ts">
import { RouterView } from 'vue-router'

import AppSidebar from '@/components/navigation/AppSidebar.vue'
import AppTopbar from '@/components/navigation/AppTopbar.vue'
</script>

<template>
  <div class="app-shell">
    <AppSidebar />

    <main class="app-main">
      <div class="app-content">
        <AppTopbar />
        <RouterView />
      </div>
    </main>
  </div>
</template>
