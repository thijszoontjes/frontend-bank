<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import MetricCard from '@/components/dashboard/MetricCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useCurrency } from '@/composables/useCurrency'
import { useCurrentUser } from '@/composables/useCurrentUser'
import { services } from '@/services'
import { useAccountStore } from '@/stores/account'
import { toErrorMessage } from '@/utils/format'

const router = useRouter()
const { formatCurrency } = useCurrency()
const { user, userId, isEmployee } = useCurrentUser()
const accountStore = useAccountStore()

const dashboardLoading = ref(false)
const dashboardError = ref('')
const employeeSummary = ref({
  totalCustomers: 0,
  pendingCustomers: 0,
  blockedCustomers: 0,
})

const isLoading = computed(() =>
  isEmployee.value ? dashboardLoading.value : accountStore.isLoading,
)

async function loadEmployeeSummary() {
  const [customers, pending, blocked] = await Promise.all([
    services.user.listUsers(0, 1, { role: 'customer' }),
    services.user.listUsers(0, 1, { role: 'customer', approvalStatus: 'pending' }),
    services.user.listUsers(0, 1, { role: 'customer', blocked: true }),
  ])

  employeeSummary.value = {
    totalCustomers: customers.page.totalElements,
    pendingCustomers: pending.page.totalElements,
    blockedCustomers: blocked.page.totalElements,
  }
}

async function loadDashboard() {
  dashboardError.value = ''

  if (isEmployee.value) {
    dashboardLoading.value = true

    try {
      await loadEmployeeSummary()
    } catch (caughtError) {
      dashboardError.value = toErrorMessage(caughtError)
    } finally {
      dashboardLoading.value = false
    }

    return
  }

  if (!userId.value) {
    return
  }

  try {
    await accountStore.load(userId.value)
  } catch (caughtError) {
    dashboardError.value = toErrorMessage(caughtError)
  }
}

onMounted(() => void loadDashboard())
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Dashboard"
      :description="
        isEmployee
          ? 'Snel overzicht van customers en approvals.'
          : 'Overzicht van je profiel, rekeningen en balances.'
      "
    />

    <LoadingState
      v-if="isLoading && (isEmployee || !accountStore.summary)"
      :label="isEmployee ? 'Dashboard laden...' : 'Accountgegevens laden...'"
    />

    <EmptyState
      v-else-if="dashboardError"
      title="Dashboard niet beschikbaar"
      :description="dashboardError"
    />

    <template v-else-if="isEmployee">
      <div class="grid-three">
        <MetricCard
          title="Customers"
          :value="String(employeeSummary.totalCustomers)"
          caption="Totaal aantal customers."
        />
        <MetricCard
          title="Pending"
          :value="String(employeeSummary.pendingCustomers)"
          caption="Wachten op approval."
        />
        <MetricCard
          title="Blocked"
          :value="String(employeeSummary.blockedCustomers)"
          caption="Momenteel geblokkeerd."
        />
      </div>

      <div class="grid-three">
        <AppCard title="Approvals">
          <p class="metric-caption">Bekijk pending registraties en keur ze goed of af.</p>
          <template #actions>
            <AppButton @click="router.push({ name: 'approvals' })">Open approvals</AppButton>
          </template>
        </AppCard>
        <AppCard title="Users">
          <p class="metric-caption">Zoek users op en werk gegevens of status bij.</p>
          <template #actions>
            <AppButton variant="secondary" @click="router.push({ name: 'users' })">Open users</AppButton>
          </template>
        </AppCard>
        <AppCard title="New customer">
          <p class="metric-caption">Maak direct een nieuwe customer met accounts aan.</p>
          <template #actions>
            <AppButton variant="secondary" @click="router.push({ name: 'user-create' })">Nieuwe customer</AppButton>
          </template>
        </AppCard>
      </div>
    </template>

    <template v-else>
      <div class="grid-three">
        <MetricCard
          title="Totaal saldo"
          :value="formatCurrency(accountStore.summary?.totalBalance ?? 0)"
          caption="Gecombineerde balance."
        />
        <MetricCard
          title="Beschikbaar"
          :value="formatCurrency(accountStore.summary?.liquidBalance ?? 0)"
          caption="Direct beschikbaar saldo."
        />
        <MetricCard
          title="Rekeningen"
          :value="String(accountStore.summary?.accountsCount ?? 0)"
          caption="Aantal gekoppelde bankrekeningen."
        />
      </div>

      <div class="grid-two">
        <AppCard title="Profiel">
          <div class="stack-sm">
            <div class="row-between">
              <span>Naam</span>
              <strong>{{ user?.firstName }} {{ user?.lastName }}</strong>
            </div>
            <div class="row-between">
              <span>E-mail</span>
              <strong>{{ user?.email }}</strong>
            </div>
            <div class="row-between">
              <span>Telefoon</span>
              <strong>{{ user?.phoneNumber ?? 'Niet beschikbaar' }}</strong>
            </div>
            <div class="row-between">
              <span>Status</span>
              <AppBadge variant="success">Approved</AppBadge>
            </div>
          </div>
        </AppCard>

        <AppCard title="Rekeningen">
          <template #actions>
            <AppButton variant="secondary" size="sm" @click="router.push({ name: 'accounts' })">Bekijk accounts</AppButton>
          </template>

          <EmptyState
            v-if="accountStore.accounts.length === 0"
            title="Geen rekeningen gevonden"
            description="Er zijn nog geen accounts beschikbaar voor deze klant."
          />
          <div v-else class="stack-sm">
            <div v-for="account in accountStore.accounts" :key="account.id" class="row-between">
              <div>
                <strong>{{ account.name }}</strong>
                <div style="color: var(--color-text-muted); font-size: 0.92rem;">{{ account.iban }}</div>
              </div>
              <strong>{{ formatCurrency(account.availableBalance, account.currency) }}</strong>
            </div>
          </div>
        </AppCard>
      </div>
    </template>
  </div>
</template>
