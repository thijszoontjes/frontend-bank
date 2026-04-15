<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AppBadge from '@/components/ui/AppBadge.vue'
import AppTable from '@/components/ui/AppTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useCurrency } from '@/composables/useCurrency'
import { useCurrentUser } from '@/composables/useCurrentUser'
import { useTransactionStore } from '@/stores/transaction'
import { formatDateTime } from '@/utils/format'

const { formatCurrency } = useCurrency()
const { userId } = useCurrentUser()
const transactionStore = useTransactionStore()

const activeFilter = ref<'all' | 'completed' | 'pending' | 'flagged'>('all')

const columns = [
  { key: 'description', label: 'Transaction' },
  { key: 'category', label: 'Category' },
  { key: 'bookedAt', label: 'Booked' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
]

const filteredTransactions = computed(() =>
  activeFilter.value === 'all'
    ? transactionStore.transactions
    : transactionStore.transactions.filter((transaction) => transaction.status === activeFilter.value),
)

async function loadTransactions() {
  if (!userId.value) {
    return
  }

  await transactionStore.load(userId.value)
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

onMounted(loadTransactions)
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Transactions"
      description="Transaction filtering stays local to the page while the data source remains inside the Pinia store."
    />

    <div class="pill-filter" role="tablist" aria-label="Transaction status filter">
      <button :class="{ 'is-active': activeFilter === 'all' }" @click="activeFilter = 'all'">All</button>
      <button :class="{ 'is-active': activeFilter === 'completed' }" @click="activeFilter = 'completed'">Completed</button>
      <button :class="{ 'is-active': activeFilter === 'pending' }" @click="activeFilter = 'pending'">Pending</button>
      <button :class="{ 'is-active': activeFilter === 'flagged' }" @click="activeFilter = 'flagged'">Flagged</button>
    </div>

    <LoadingState
      v-if="transactionStore.isLoading && transactionStore.transactions.length === 0"
      label="Loading transaction history..."
    />

    <EmptyState
      v-else-if="filteredTransactions.length === 0"
      title="No transactions for this filter"
      description="The page is wired for live filtering without needing another service call."
    />

    <AppTable v-else :columns="columns" :rows="filteredTransactions as unknown as Record<string, unknown>[]">
      <template #cell-description="{ row }">
        <div class="table-meta">
          <strong>{{ row.description }}</strong>
          <span>{{ row.counterparty }}</span>
        </div>
      </template>
      <template #cell-category="{ value }">
        {{ value }}
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
  </div>
</template>
