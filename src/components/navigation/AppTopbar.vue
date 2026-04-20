<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()

const routeTitle = computed(() => route.meta.title ?? 'Workspace')
const routeDescription = computed(() =>
  authStore.role === 'employee'
    ? 'Manage customers and approvals.'
    : 'View your accounts and balances.',
)

async function handleLogout() {
  await authStore.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-title">
      <h1>{{ routeTitle }}</h1>
      <p>{{ routeDescription }}</p>
    </div>

    <div class="topbar-user">
      <AppBadge :variant="authStore.role === 'employee' ? 'info' : 'success'">
        {{ authStore.role }}
      </AppBadge>
      <div>
        <strong>{{ userStore.fullName }}</strong>
        <div style="color: var(--color-text-muted); font-size: 0.9rem;">{{ authStore.user?.email }}</div>
      </div>
      <div class="avatar-pill">{{ authStore.user?.initials }}</div>
      <AppButton variant="secondary" size="sm" @click="handleLogout">Logout</AppButton>
    </div>
  </header>
</template>
