<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { services } from '@/services'
import type { PageMetadata } from '@/types/common'
import type { AmountComparisonOperator, Transaction, TransactionListFilters } from '@/types/transaction'
import { formatCurrency, formatDateTime, toErrorMessage } from '@/utils/format'

const pageSize = 25

const transactions = ref<Transaction[]>([])
const pagination = ref<PageMetadata | null>(null)
const listLoading = ref(false)
const listError = ref('')
const sortBy = ref('transactionId')
const sortDir = ref('DESC')

const filters = reactive<{
  search: string
  startDate: string
  endDate: string
  amountOperator: 'none' | AmountComparisonOperator
  amountValue: number | ''
}>({
  search: '',
  startDate: '',
  endDate: '',
  amountOperator: 'none',
  amountValue: '',
})

function buildFilters(): TransactionListFilters {
  const hasAmount = filters.amountOperator !== 'none' && filters.amountValue !== ''

  return {
    search: filters.search.trim() || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    amountOperator: hasAmount ? (filters.amountOperator as AmountComparisonOperator) : undefined,
    amountValue: hasAmount ? (filters.amountValue as number) : undefined,
  }
}

const pageSummary = computed(() => {
  if (!pagination.value || pagination.value.totalElements === 0) {
    return '0 transactions'
  }

  const start = (pagination.value.page ?? 0) * (pagination.value.size ?? pageSize) + 1
  const end = Math.min(start + transactions.value.length - 1, pagination.value.totalElements)

  return `${start}-${end} of ${pagination.value.totalElements} transactions`
})

function transactionTypeVariant(type: string) {
  switch (type) {
    case 'DEPOSIT':
      return 'success'
    case 'WITHDRAWAL':
      return 'danger'
    default:
      return 'info'
  }
}

function transactionTypeLabel(type: string) {
  switch (type) {
    case 'DEPOSIT':
      return 'Deposit'
    case 'WITHDRAWAL':
      return 'Withdrawal'
    default:
      return 'Transfer'
  }
}

function toggleSort(column: string) {
  if (sortBy.value === column) {
    // Toggle direction
    sortDir.value = sortDir.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    // Change column, default to DESC
    sortBy.value = column
    sortDir.value = 'DESC'
  }
  // Reset to first page when sorting changes
  loadTransactions(0)
}

function getSortIndicator(column: string) {
  if (sortBy.value !== column) {
    return ''
  }
  return sortDir.value === 'ASC' ? ' ↑' : ' ↓'
}

async function loadTransactions(page = 0) {
  listLoading.value = true
  listError.value = ''

  try {
    const result = await services.transaction.listTransactions(
      page,
      pageSize,
      sortBy.value,
      sortDir.value,
      buildFilters(),
    )
    transactions.value = result.items
    pagination.value = result.page
  } catch (caughtError) {
    listError.value = toErrorMessage(caughtError)
  } finally {
    listLoading.value = false
  }
}

async function refreshCurrentPage() {
  await loadTransactions(pagination.value?.page ?? 0)
}

onMounted(() => void loadTransactions())
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Transactions"
      description="View all transactions processed through the banking system with filtering, sorting, and pagination."
    >
      <template #actions>
        <AppButton variant="secondary" @click="refreshCurrentPage()">Refresh</AppButton>
      </template>
    </PageHeader>

    <AppCard title="Transaction overview" :subtitle="pageSummary">
      <template #actions>
        <div class="directory-actions">
          <AppButton variant="secondary" size="sm" :disabled="listLoading" @click="loadTransactions(0)">
            Apply filters
          </AppButton>
        </div>
      </template>

      <div class="directory-filters">
        <AppInput
          v-model="filters.search"
          type="text"
          label="Search"
          placeholder="Transaction ID, IBAN, description..."
        />
        <AppInput v-model="filters.startDate" type="date" label="Start Date" />
        <AppInput v-model="filters.endDate" type="date" label="End Date" />
        <label class="input-group">
          <span class="input-label">Amount</span>
          <select v-model="filters.amountOperator" class="input-control">
            <option value="none">No filter</option>
            <option value="gt">More than</option>
            <option value="eq">Equal to</option>
            <option value="lt">Less than</option>
          </select>
        </label>
        <label class="input-group" :class="{ 'input-group--disabled': filters.amountOperator === 'none' }">
          <span class="input-label">Amount (€)</span>
          <input
            v-model="filters.amountValue"
            type="number"
            placeholder="0.00"
            class="input-control"
            :disabled="filters.amountOperator === 'none'"
          />
        </label>
      </div>

      <span v-if="listError" class="input-error directory-error">{{ listError }}</span>

      <LoadingState v-if="listLoading && transactions.length === 0" label="Loading transactions..." />

      <EmptyState
        v-else-if="transactions.length === 0"
        title="No transactions found"
        description="Adjust the filters or refresh the list."
      />

      <div v-else class="transactions-table-shell" :class="{ 'is-refreshing': listLoading }">
        <div class="transactions-table-wrap">
          <table class="table transactions-table">
            <thead>
              <tr>
                <th>
                  <button
                    class="sort-button"
                    :class="{ 'is-active': sortBy === 'transactionId' }"
                    @click="toggleSort('transactionId')"
                  >
                    Transaction ID{{ getSortIndicator('transactionId') }}
                  </button>
                </th>
                <th>From Account</th>
                <th>To Account</th>
                <th>
                  <button
                    class="sort-button"
                    :class="{ 'is-active': sortBy === 'amount' }"
                    @click="toggleSort('amount')"
                  >
                    Amount{{ getSortIndicator('amount') }}
                  </button>
                </th>
                <th>Type</th>
                <th>Description</th>
                <th>
                  <button
                    class="sort-button"
                    :class="{ 'is-active': sortBy === 'createdAt' }"
                    @click="toggleSort('createdAt')"
                  >
                    Timestamp{{ getSortIndicator('createdAt') }}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in transactions" :key="transaction.transactionId" class="transaction-row">
                <td>{{ transaction.transactionId }}</td>
                <td>
                  <span class="iban">{{ transaction.fromAccount }}</span>
                </td>
                <td>
                  <span class="iban">{{ transaction.toAccount }}</span>
                </td>
                <td>
                  <strong class="amount">{{ formatCurrency(transaction.amount) }}</strong>
                </td>
                <td>
                  <AppBadge :variant="transactionTypeVariant(transaction.type)">
                    {{ transactionTypeLabel(transaction.type) }}
                  </AppBadge>
                </td>
                <td>
                  <span class="description">{{ transaction.description || '-' }}</span>
                </td>
                <td>{{ formatDateTime(transaction.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer" v-if="pagination">
          <span>{{ pageSummary }}</span>
          <div class="button-group">
            <AppButton
              variant="secondary"
              size="sm"
              :disabled="listLoading || (pagination.page ?? 0) === 0"
              @click="loadTransactions((pagination.page ?? 0) - 1)"
            >
              Previous
            </AppButton>
            <AppButton
              variant="secondary"
              size="sm"
              :disabled="listLoading || (pagination.page ?? 0) + 1 >= (pagination.totalPages ?? 1)"
              @click="loadTransactions((pagination.page ?? 0) + 1)"
            >
              Next
            </AppButton>
          </div>
        </div>
      </div>

      <div v-if="transactions.length === 0 && pagination" class="table-footer">
        <span>{{ pageSummary }}</span>
        <div class="button-group">
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="listLoading || (pagination.page ?? 0) === 0"
            @click="loadTransactions((pagination.page ?? 0) - 1)"
          >
            Previous
          </AppButton>
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="listLoading || (pagination.page ?? 0) + 1 >= (pagination.totalPages ?? 1)"
            @click="loadTransactions((pagination.page ?? 0) + 1)"
          >
            Next
          </AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>

<style scoped>
.directory-actions {
  display: flex;
  justify-content: flex-end;
}

.directory-filters {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.input-group--disabled .input-label {
  opacity: 0.45;
}

@media (max-width: 1100px) {
  .directory-filters {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.directory-error {
  display: block;
  margin-bottom: 1rem;
}

.transactions-table-shell {
  display: grid;
  gap: 1rem;
}

.transactions-table-shell.is-refreshing {
  opacity: 0.74;
}

.transactions-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.58);
}

.transactions-table {
  min-width: 1200px;
}

.transactions-table th,
.transactions-table td {
  white-space: nowrap;
}

.sort-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
  font: inherit;
  text-align: left;
  display: inline;
}

.sort-button:hover {
  color: var(--color-primary);
}

.sort-button.is-active {
  color: var(--color-primary);
  font-weight: 600;
}

.transaction-row {
  cursor: default;
}

.transaction-row:hover {
  background-color: rgba(18, 62, 53, 0.035);
}

.iban {
  font-family: monospace;
  font-size: 0.9em;
}

.amount {
  color: var(--color-success);
}

.description {
  color: var(--color-text-muted);
  max-width: 20rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.table-footer span {
  color: var(--color-text-muted);
}
</style>
