<script setup lang="ts">
import { onMounted } from 'vue'

import AppBadge from '@/components/ui/AppBadge.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppTable from '@/components/ui/AppTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useCurrency } from '@/composables/useCurrency'
import { useCurrentUser } from '@/composables/useCurrentUser'
import { useAccountStore } from '@/stores/account'
import { formatDateTime } from '@/utils/format'

const { formatCurrency } = useCurrency()
const { userId } = useCurrentUser()
const accountStore = useAccountStore()

const columns = [
  { key: 'name', label: 'Account' },
  { key: 'type', label: 'Type' },
  { key: 'availableBalance', label: 'Balance' },
  { key: 'dailyLimit', label: 'Daily limit' },
  { key: 'status', label: 'Status' },
  { key: 'updatedAt', label: 'Created' },
]

async function loadAccounts() {
  if (!userId.value) {
    return
  }

  try {
    await accountStore.load(userId.value)
  } catch {
    // Store state is shown in the template.
  }
}

function statusVariant(status: string) {
  if (status === 'active') {
    return 'success'
  }

  if (status === 'review') {
    return 'warning'
  }

  return 'danger'
}

onMounted(() => void loadAccounts())
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Accounts overview"
      description="Personal account information, bank accounts, and balances for the signed-in customer."
    />

    <LoadingState v-if="accountStore.isLoading && accountStore.accounts.length === 0" label="Loading account portfolio..." />

    <EmptyState
      v-else-if="accountStore.error && accountStore.accounts.length === 0"
      title="Account information unavailable"
      :description="accountStore.error"
    />

    <template v-else>
      <div class="grid-three" v-if="accountStore.summary">
        <AppCard title="Total balance">
          <p class="metric-value">{{ formatCurrency(accountStore.summary.totalBalance) }}</p>
        </AppCard>
        <AppCard title="Available balance">
          <p class="metric-value">{{ formatCurrency(accountStore.summary.liquidBalance) }}</p>
        </AppCard>
        <AppCard title="Accounts">
          <p class="metric-value">{{ accountStore.summary.accountsCount }}</p>
        </AppCard>
      </div>

      <EmptyState
        v-if="accountStore.accounts.length === 0"
        title="No accounts available"
        description="There are no bank accounts linked to this customer yet."
      />

      <template v-else>
        <div class="grid-two">
          <AppCard
            v-for="account in accountStore.accounts"
            :key="account.id"
            :title="account.name"
            :subtitle="account.iban"
          >
            <div class="stack-sm">
              <div class="row-between">
                <span>Balance</span>
                <strong>{{ formatCurrency(account.availableBalance, account.currency) }}</strong>
              </div>
              <div class="row-between">
                <span>Daily limit</span>
                <strong>{{ formatCurrency(account.dailyLimit ?? 0, account.currency) }}</strong>
              </div>
              <div class="row-between">
                <span>Absolute limit</span>
                <strong>{{ formatCurrency(account.absoluteLimit ?? 0, account.currency) }}</strong>
              </div>
              <div class="row-between">
                <span>Status</span>
                <AppBadge :variant="statusVariant(account.status)">{{ account.status }}</AppBadge>
              </div>
            </div>
          </AppCard>
        </div>

        <AppTable :columns="columns" :rows="accountStore.accounts as unknown as Record<string, unknown>[]">
          <template #cell-name="{ row }">
            <div class="table-meta">
              <strong>{{ row.name }}</strong>
              <span>{{ row.iban }}</span>
            </div>
          </template>
          <template #cell-type="{ value }">
            <span style="text-transform: capitalize;">{{ value }}</span>
          </template>
          <template #cell-availableBalance="{ row }">
            <strong>{{ formatCurrency(Number(row.availableBalance), String(row.currency)) }}</strong>
          </template>
          <template #cell-dailyLimit="{ row }">
            {{ formatCurrency(Number(row.dailyLimit ?? 0), String(row.currency)) }}
          </template>
          <template #cell-status="{ value }">
            <AppBadge :variant="statusVariant(String(value))">{{ value }}</AppBadge>
          </template>
          <template #cell-updatedAt="{ value }">
            {{ formatDateTime(String(value)) }}
          </template>
        </AppTable>
      </template>
    </template>
  </div>
</template>
