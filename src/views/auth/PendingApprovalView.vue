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
      title="Aanvraag in behandeling"
      subtitle="Je registratie is ontvangen. Een employee moet je account nog beoordelen voordat je bankrekeningen worden aangemaakt."
    >
      <div class="stack-sm">
        <div class="row-between">
          <span>Status</span>
          <AppBadge variant="warning">Pending approval</AppBadge>
        </div>
        <div class="row-between">
          <span>Klant</span>
          <strong>{{ userStore.fullName }}</strong>
        </div>
        <div class="row-between">
          <span>E-mail</span>
          <strong>{{ authStore.user?.email }}</strong>
        </div>
        <div class="row-between">
          <span>Volgende stap</span>
          <strong>Employee approval met checking- en savingslimieten</strong>
        </div>
      </div>
    </AppCard>

    <AppCard
      title="Wat je nu wel kunt doen"
      subtitle="Je mag al inloggen, maar normale customer-functionaliteit blijft geblokkeerd totdat je bent goedgekeurd."
    >
      <div class="stack-sm">
        <span>Vraag de employee om je registratie te beoordelen.</span>
        <span>Gebruik daarna `Status opnieuw controleren` om je sessie te verversen.</span>
        <span v-if="refreshError" class="input-error">{{ refreshError }}</span>
      </div>

      <template #actions>
        <div class="button-group">
          <AppButton variant="secondary" :disabled="isRefreshing" @click="handleRefresh">
            {{ isRefreshing ? 'Controleren...' : 'Status opnieuw controleren' }}
          </AppButton>
          <AppButton variant="ghost" @click="handleLogout">Uitloggen</AppButton>
        </div>
      </template>
    </AppCard>
  </div>
</template>
