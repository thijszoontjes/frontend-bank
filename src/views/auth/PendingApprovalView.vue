<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { toErrorMessage } from '@/utils/format'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()

const isRefreshing = ref(false)
const refreshError = ref('')

async function handleRefresh() {
  isRefreshing.value = true
  refreshError.value = ''

  try {
    const nextUser = await authStore.refreshCurrentUser()

    if (nextUser?.approved) {
      await router.push({ name: 'dashboard' })
    }
  } catch (caughtError) {
    refreshError.value = toErrorMessage(caughtError)
  } finally {
    isRefreshing.value = false
  }
}

async function handleLogout() {
  await authStore.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="page-stack">
    <AppCard
      title="Application pending"
      subtitle="Your registration has been received. An employee still needs to review your account before your bank accounts are created."
    >
      <div class="stack-sm">
        <div class="row-between">
          <span>Status</span>
          <AppBadge variant="warning">Pending approval</AppBadge>
        </div>
        <div class="row-between">
          <span>Customer</span>
          <strong>{{ userStore.fullName }}</strong>
        </div>
        <div class="row-between">
          <span>Email</span>
          <strong>{{ authStore.user?.email }}</strong>
        </div>
        <div class="row-between">
          <span>Next step</span>
          <strong>Employee approval with checking and savings limits</strong>
        </div>
      </div>
    </AppCard>

    <AppCard
      title="What you can do now"
      subtitle="You can already sign in, but normal customer functionality remains blocked until you are approved."
    >
      <div class="stack-sm">
        <span>Ask an employee to review your registration.</span>
        <span>Then use `Check status again` to refresh your session.</span>
        <span v-if="refreshError" class="input-error">{{ refreshError }}</span>
      </div>

      <template #actions>
        <div class="button-group">
          <AppButton variant="secondary" :disabled="isRefreshing" @click="handleRefresh">
            {{ isRefreshing ? 'Checking...' : 'Check status again' }}
          </AppButton>
          <AppButton variant="ghost" @click="handleLogout">Log out</AppButton>
        </div>
      </template>
    </AppCard>
  </div>
</template>
