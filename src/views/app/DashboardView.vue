<script setup lang="ts">
import { computed, onMounted } from 'vue'

import MetricCard from '@/components/dashboard/MetricCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppTable from '@/components/ui/AppTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useCurrency } from '@/composables/useCurrency'
import { useCurrentUser } from '@/composables/useCurrentUser'
import { useAccountStore } from '@/stores/account'
import { useApprovalStore } from '@/stores/approval'
import { useTransactionStore } from '@/stores/transaction'
import { formatDateTime } from '@/utils/format'

const { formatCompactCurrency, formatCurrency } = useCurrency()
const { userId, isEmployee } = useCurrentUser()

const accountStore = useAccountStore()
const transactionStore = useTransactionStore()
const approvalStore = useApprovalStore()

const isBusy = computed(
  () => accountStore.isLoading || transactionStore.isLoading || approvalStore.isLoading,
)

const monthlyOutflow = computed(() =>
  transactionStore.transactions
    .filter((transaction) => transaction.direction === 'debit')
    .reduce((sum, transaction) => sum + transaction.amount, 0),
)

const flaggedCount = computed(
  () => transactionStore.transactions.filter((transaction) => transaction.status === 'flagged').length,
)

const dashboardColumns = [
  { key: 'description', label: 'Transaction' },
  { key: 'bookedAt', label: 'Booked' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
]

const tableRows = computed(() => transactionStore.recentTransactions as unknown as Record<string, unknown>[])

async function loadDashboard() {
  if (!userId.value) {
    return
  }

  await Promise.all([
    accountStore.load(userId.value),
    transactionStore.load(userId.value),
    isEmployee.value ? approvalStore.load() : Promise.resolve(),
  ])
}

function statusVariant(status: string) {
  if (status === 'completed') {
    return 'success'
  }

  if (status === 'pending') {
    return 'warning'
  }

  return 'danger'
}

onMounted(loadDashboard)
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Dashboard"
      description="A high-level overview that already consumes domain stores instead of hardcoding data inside the page."
    >
      <template #actions>
        <AppButton variant="secondary" @click="loadDashboard">Refresh data</AppButton>
      </template>
    </PageHeader>

    <LoadingState v-if="isBusy && !accountStore.summary" label="Preparing your dashboard..." />

    <template v-else>
      <div class="grid-three">
        <MetricCard
          title="Total balance"
          :value="formatCompactCurrency(accountStore.summary?.totalBalance ?? 0)"
          caption="Combined ledger balance across available accounts."
        />
        <MetricCard
          title="Liquid funds"
          :value="formatCompactCurrency(accountStore.summary?.liquidBalance ?? 0)"
          caption="Available balance ready for direct use."
        />
        <MetricCard
          v-if="isEmployee"
          title="Pending approvals"
          :value="String(approvalStore.pendingCount)"
          caption="Items that require manual employee review."
        />
        <MetricCard
          v-else
          title="Monthly outflow"
          :value="formatCompactCurrency(monthlyOutflow)"
          caption="Total debits currently visible in the mock dataset."
        />
      </div>

      <div class="grid-two">
        <AppCard title="Operational snapshot" subtitle="Small metrics that show how the stores can feed different widgets.">
          <div class="stack-sm">
            <div class="row-between">
              <span>Accounts available</span>
              <strong>{{ accountStore.summary?.accountsCount ?? 0 }}</strong>
            </div>
            <div class="row-between">
              <span>Flagged transactions</span>
              <strong>{{ flaggedCount }}</strong>
            </div>
            <div class="row-between">
              <span>Primary currency</span>
              <strong>{{ accountStore.summary?.mainCurrency ?? 'EUR' }}</strong>
            </div>
          </div>
        </AppCard>

        <AppCard
          title="Role-aware behaviour"
          subtitle="The same route tree supports customers and employees through store state and route meta."
        >
          <div class="stack-sm">
            <div class="row-between">
              <span>Current role</span>
              <AppBadge :variant="isEmployee ? 'info' : 'success'">{{ isEmployee ? 'employee' : 'customer' }}</AppBadge>
            </div>
            <div class="row-between">
              <span>Approvals route access</span>
              <strong>{{ isEmployee ? 'Enabled' : 'Restricted' }}</strong>
            </div>
            <div class="row-between">
              <span>Backend mode</span>
              <strong>Mock-ready</strong>
            </div>
          </div>
        </AppCard>
      </div>

      <section class="page-section">
        <div>
          <h3 style="margin: 0; font-size: 1.15rem;">Recent activity</h3>
          <p style="margin: 0.4rem 0 0; color: var(--color-text-muted);">
            This table is powered by the transaction store and reusable table component.
          </p>
        </div>
        <EmptyState
          v-if="transactionStore.recentTransactions.length === 0"
          title="No activity yet"
          description="Once transactions exist, this area becomes a quick operational summary."
        />
        <AppTable v-else :columns="dashboardColumns" :rows="tableRows">
          <template #cell-description="{ row }">
            <div class="table-meta">
              <strong>{{ row.description }}</strong>
              <span>{{ row.counterparty }}</span>
            </div>
          </template>
          <template #cell-bookedAt="{ value }">
            {{ formatDateTime(String(value)) }}
          </template>
          <template #cell-amount="{ row }">
            <span :class="row.direction === 'credit' ? 'amount-positive' : 'amount-negative'">
              {{ row.direction === 'credit' ? '+' : '-' }}{{ formatCurrency(Number(row.amount), String(row.currency)) }}
            </span>
          </template>
          <template #cell-status="{ value }">
            <AppBadge :variant="statusVariant(String(value))">{{ value }}</AppBadge>
          </template>
        </AppTable>
      </section>
    </template>
  </div>
</template>
