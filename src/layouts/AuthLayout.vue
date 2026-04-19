<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="auth-shell">
    <main class="auth-main">
      <div class="auth-header">
        <h1>Bank App</h1>
        <p>Log in om verder te gaan.</p>
      </div>
      <div class="auth-panel">
        <RouterView />
      </div>
    </main>
  </div>
</template>
