<script setup lang="ts">
import { RouterView } from 'vue-router'

import logoMark from '@/assets/logo-mark.svg'
</script>

<template>
  <div class="auth-shell">
    <aside class="auth-aside">
      <div class="auth-copy">
        <div class="auth-brand">
          <img :src="logoMark" alt="Frontend Bank logo" />
          <span>Frontend Bank</span>
        </div>

        <div>
          <h1>Professional banking frontend starter.</h1>
          <p>
            Built as a mock-first SPA with Vue 3, Pinia and vue-router, ready to connect to a Spring Boot REST API
            without reshaping the app structure later.
          </p>
        </div>
      </div>

      <div class="auth-feature-list">
        <div class="auth-feature">
          <strong>Mock-first service layer</strong>
          <span>Start fast with dummy data and switch implementations through environment configuration.</span>
        </div>
        <div class="auth-feature">
          <strong>Customer and employee flows</strong>
          <span>Routes and guards are already prepared for role-based navigation and approvals.</span>
        </div>
        <div class="auth-feature">
          <strong>Assessment-friendly architecture</strong>
          <span>Views, stores, services and domain models are separated in a predictable and scalable way.</span>
        </div>
      </div>
    </aside>

    <main class="auth-main">
      <div class="auth-panel">
        <RouterView />
      </div>
    </main>
  </div>
</template>
