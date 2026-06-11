<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import TransactionForm from '@/components/TransactionForm.vue'
import { services } from '@/services'
import { useAccountStore } from '@/stores/account'
import type { PageMetadata } from '@/types/common'
import type { AmountComparisonOperator, Transaction, CreateTransactionPayload } from '@/types/transaction'
import type { UserProfile } from '@/types/user'
import { formatCurrency, formatDateTime, toErrorMessage } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const accountStore = useAccountStore()

const selectedUserId = computed(() => String(route.params.userId ?? ''))
const selectedUser = ref<UserProfile | null>(null)
const pageError = ref('')
const pageSize = 25

const accounts = computed(() => accountStore.accounts)

// Transaction list local state
const transactions = ref<Transaction[]>([])
const pagination = ref<PageMetadata | null>(null)
const listLoading = ref(false)
const listError = ref('')

// Create form state
const submitError = ref('')
const submitMessage = ref('')
const isSubmitting = ref(false)

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

function buildFilters() {
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
  return `${start}–${end} of ${pagination.value.totalElements} transactions`
})

async function loadTransactions(page = 0) {
  if (!selectedUserId.value) return
  listLoading.value = true
  listError.value = ''

  try {
    const result = await services.transaction.listTransactionsByUser(
      selectedUserId.value,
      page,
      pageSize,
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

async function loadData() {
  if (!selectedUserId.value) return
  pageError.value = ''

  try {
    const [user] = await Promise.all([
      services.user.getUserById(selectedUserId.value),
      accountStore.load(selectedUserId.value),
      loadTransactions(0),
    ])
    selectedUser.value = user
  } catch (caughtError) {
    pageError.value = toErrorMessage(caughtError)
  }
}

async function handleCreate(payload: CreateTransactionPayload) {
  submitError.value = ''
  submitMessage.value = ''
  isSubmitting.value = true

  try {
    await services.transaction.createTransaction(payload)
    submitMessage.value = 'Transfer successfully created.'
    await Promise.all([
      accountStore.load(selectedUserId.value),
      loadTransactions(0),
    ])
  } catch (caughtError) {
    submitError.value = toErrorMessage(caughtError)
  } finally {
    isSubmitting.value = false
  }
}

function transactionTypeVariant(type: string) {
  if (type === 'DEPOSIT') return 'success'
  if (type === 'WITHDRAWAL') return 'danger'
  return 'info'
}

function transactionTypeLabel(type: string) {
  if (type === 'DEPOSIT') return 'Deposit'
  if (type === 'WITHDRAWAL') return 'Withdrawal'
  return 'Transfer'
}

function backToUsers() {
  router.push({ name: 'users' })
}

onMounted(loadData)
</script>

<template>
  <div class="page-stack">
    <PageHeader
      :title="selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Customer transactions'"
      description="This page shows all transactions for the selected customer."
    >
      <template #actions>
        <AppButton variant="secondary" @click="backToUsers">Back to users</AppButton>
      </template>
    </PageHeader>

    <LoadingState v-if="!selectedUser && !pageError" label="Loading customer..." />

    <EmptyState
      v-else-if="pageError && !selectedUser"
      title="Unable to load customer"
      :description="pageError"
    />

    <template v-else>
      <div class="grid-two" style="gap: 1rem; align-items: flex-start;">
        <AppCard title="Customer details" v-if="selectedUser">
          <div class="stack-sm">
            <div class="row-between">
              <span>Name</span>
              <strong>{{ selectedUser.firstName }} {{ selectedUser.lastName }}</strong>
            </div>
            <div class="row-between">
              <span>Email</span>
              <strong>{{ selectedUser.email }}</strong>
            </div>
            <div class="row-between">
              <span>Role</span>
              <AppBadge :variant="selectedUser.role === 'employee' ? 'info' : 'neutral'">
                {{ selectedUser.role }}
              </AppBadge>
            </div>
          </div>
        </AppCard>

        <AppCard title="Create transfer">
          <TransactionForm
            :accounts="accounts"
            :disabled="isSubmitting"
            submitLabel="Create transfer"
            @submit="handleCreate"
          />
          <span v-if="submitError" class="input-error">{{ submitError }}</span>
          <span v-if="submitMessage" style="color: var(--color-success);">{{ submitMessage }}</span>
        </AppCard>
      </div>

      <AppCard title="All transactions">
        <template #actions>
          <span class="directory-summary">{{ pageSummary }}</span>
        </template>

        <div class="directory-filters">
          <AppInput
            v-model="filters.search"
            type="text"
            label="Search IBAN"
            placeholder="From / to IBAN..."
          />
          <AppInput v-model="filters.startDate" type="date" label="Start date" />
          <AppInput v-model="filters.endDate" type="date" label="End date" />
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

        <div class="filter-actions">
          <AppButton variant="secondary" size="sm" :disabled="listLoading" @click="loadTransactions(0)">
            Apply filters
          </AppButton>
        </div>

        <span v-if="listError" class="input-error directory-error">{{ listError }}</span>

        <LoadingState v-if="listLoading && transactions.length === 0" label="Loading transactions..." />

        <EmptyState
          v-else-if="!listLoading && transactions.length === 0"
          title="No transactions found"
          description="This customer has no transactions matching the current filters."
        />

        <template v-else>
          <div class="transactions-table-shell" :class="{ 'is-refreshing': listLoading }">
            <div class="transactions-table-wrap">
              <table class="table transactions-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="transaction in transactions" :key="transaction.transactionId">
                    <td>{{ transaction.transactionId }}</td>
                    <td class="iban-cell">{{ transaction.fromAccount || '—' }}</td>
                    <td class="iban-cell">{{ transaction.toAccount || '—' }}</td>
                    <td>
                      <strong>{{ formatCurrency(transaction.amount) }}</strong>
                    </td>
                    <td>
                      <AppBadge :variant="transactionTypeVariant(transaction.type)">
                        {{ transactionTypeLabel(transaction.type) }}
                      </AppBadge>
                    </td>
                    <td>
                      <span class="description">{{ transaction.description || '—' }}</span>
                    </td>
                    <td>{{ formatDateTime(transaction.createdAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="pagination" class="table-footer">
            <span>Page {{ (pagination.page ?? 0) + 1 }} of {{ pagination.totalPages ?? 1 }}</span>
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
        </template>

        <div v-if="transactions.length === 0 && pagination" class="table-footer">
          <span>Page {{ (pagination.page ?? 0) + 1 }} of {{ pagination.totalPages ?? 1 }}</span>
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
    </template>
  </div>
</template>

<style scoped>
.directory-filters {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.85rem;
  margin-bottom: 0.75rem;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.85rem;
}

.input-group--disabled .input-label {
  opacity: 0.45;
}

.directory-summary {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  white-space: nowrap;
}

.directory-error {
  display: block;
  margin-bottom: 0.75rem;
}

.transactions-table-shell {
  display: flex;
  flex-direction: column;
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
  min-width: 900px;
}

.transactions-table th,
.transactions-table td {
  white-space: nowrap;
  padding: 0.6rem 1rem;
}

.iban-cell {
  font-family: monospace;
  font-size: 0.9em;
  letter-spacing: 0.04em;
}

.description {
  color: var(--color-text-muted);
  max-width: 16rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.table-footer span {
  color: var(--color-text-muted);
}

@media (max-width: 1100px) {
  .directory-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
