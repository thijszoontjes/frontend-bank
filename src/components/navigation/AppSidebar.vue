<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import logoMark from '@/assets/logo-mark.svg'
import { navigationItems } from '@/constants/navigation'
import { appConfig } from '@/services/config'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const visibleItems = computed(() =>
  navigationItems.filter((item) => !item.roles || (authStore.role ? item.roles.includes(authStore.role) : false)),
)
</script>

<template>
  <aside class="app-sidebar">
    <div class="sidebar-brand">
      <img :src="logoMark" alt="Frontend Bank logo" />
      <div>
        <strong>Frontend Bank</strong>
        <span>Banking workspace</span>
      </div>
    </div>

    <nav class="sidebar-nav" aria-label="Main navigation">
      <RouterLink
        v-for="item in visibleItems"
        :key="item.to"
        :to="item.to"
        class="nav-link"
      >
        <span class="nav-link-mark">{{ item.shortLabel }}</span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footnote">
      <strong>{{ appConfig.apiMode === 'mock' ? 'Mock mode active' : 'Live API mode' }}</strong>
      <p>
        Services are resolved centrally, so switching to Spring Boot later only changes the implementation layer.
      </p>
    </div>
  </aside>
</template>
