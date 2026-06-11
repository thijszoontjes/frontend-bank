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
import { useCurrentUser } from '@/composables/useCurrentUser'
import type { PageMetadata } from '@/types/common'
import type { AmountComparisonOperator, Transaction, CreateTransactionPayload } from '@/types/transaction'
import type { IbanSearchResult } from '@/types/account'
import { formatCurrency, formatDateTime, toErrorMessage } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const { userId } = useCurrentUser()
const accountStore = useAccountStore()

const iban = computed(() => route.params.iban as string || '')
const pageError = ref('')
const pageSize = 25

const currentAccount = computed(() =>
  accountStore.accounts.find((account) => account.iban === iban.value),
)
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
const selectedToIban = ref('')

// IBAN search state
const searchFirstName = ref('')
const searchLastName = ref('')
const searchResults = ref<IbanSearchResult[]>([])
const searchLoading = ref(false)
const searchError = ref('')
const searchDone = ref(false)

async function searchIban() {
  if (!searchFirstName.value.trim() || !searchLastName.value.trim()) {
    searchError.value = 'Enter both a first name and a last name.'
    return
  }
  searchLoading.value = true
  searchError.value = ''
  searchDone.value = false
  searchResults.value = []

  try {
    searchResults.value = await services.account.searchIbanByName(
      searchFirstName.value.trim(),
      searchLastName.value.trim(),
    )
    searchDone.value = true
  } catch (caughtError) {
    searchError.value = toErrorMessage(caughtError)
  } finally {
    searchLoading.value = false
  }
}

function useIban(iban: string) {
  selectedToIban.value = iban
}

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
  if (!iban.value) return
  listLoading.value = true
  listError.value = ''

  try {
    const result = await services.transaction.listTransactionsByAccount(
      iban.value,
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
  if (!userId.value || !iban.value) return
  pageError.value = ''

  try {
    await accountStore.load(userId.value)
    await loadTransactions(0)
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
      accountStore.load(userId.value!),
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

function backToAccounts() {
  router.push({ name: 'accounts' })
}

onMounted(loadData)
</script>

<template>
  <div class="page-stack">
    <PageHeader
      :title="currentAccount ? `Transactions for ${currentAccount.name}` : 'Account transactions'"
      description="This account page shows only transactions for the selected account."
    >
      <template #actions>
        <AppButton variant="secondary" @click="backToAccounts">Back to accounts</AppButton>
      </template>
    </PageHeader>

    <LoadingState
      v-if="!currentAccount && !pageError"
      label="Loading account..."
    />

    <EmptyState
      v-else-if="pageError && !currentAccount"
      title="Unable to load account"
      :description="pageError"
    />

    <template v-else>
      <div class="grid-two" style="gap: 1rem; align-items: flex-start;">
        <div class="left-stack">
          <AppCard title="Account details" v-if="currentAccount">
            <div class="stack-sm">
              <div class="row-between">
                <span>IBAN</span>
                <strong>{{ currentAccount.iban }}</strong>
              </div>
              <div class="row-between">
                <span>Account</span>
                <strong>{{ currentAccount.name }}</strong>
              </div>
              <div class="row-between">
                <span>Balance</span>
                <strong>{{ formatCurrency(currentAccount.availableBalance, currentAccount.currency) }}</strong>
              </div>
              <div class="row-between">
                <span>Status</span>
                <AppBadge :variant="currentAccount.status === 'active' ? 'success' : 'danger'">
                  {{ currentAccount.status }}
                </AppBadge>
              </div>
            </div>
          </AppCard>

          <AppCard title="Search IBAN">
            <div class="stack-sm">
              <AppInput v-model="searchFirstName" label="First name" placeholder="e.g. Lena" type="text" />
              <AppInput v-model="searchLastName" label="Last name" placeholder="e.g. de Vries" type="text" />
              <AppButton :disabled="searchLoading" @click="searchIban">Search</AppButton>
              <span v-if="searchError" class="input-error">{{ searchError }}</span>
            </div>

            <div v-if="searchDone" class="search-results">
              <p v-if="searchResults.length === 0" class="search-empty">
                No active checking account found for this name.
              </p>
              <div
                v-for="result in searchResults"
                :key="result.iban"
                class="search-result-row"
              >
                <div class="search-result-info">
                  <span class="search-result-name">{{ result.ownerName }}</span>
                  <span class="search-result-iban">{{ result.iban }}</span>
                </div>
                <AppButton variant="secondary" size="sm" @click="useIban(result.iban)">
                  Use
                </AppButton>
              </div>
            </div>
          </AppCard>
        </div>

        <AppCard title="Create transfer">
          <TransactionForm
            :accounts="accounts"
            :defaultFromIban="iban"
            :defaultToIban="selectedToIban"
            :disabled="isSubmitting"
            submitLabel="Create transfer"
            @submit="handleCreate"
          />
          <span v-if="submitError" class="input-error">{{ submitError }}</span>
          <span v-if="submitMessage" style="color: var(--color-success);">{{ submitMessage }}</span>
        </AppCard>
      </div>

      <AppCard title="Account transactions">
        <template #actions>
          <span class="directory-summary">{{ pageSummary }}</span>
        </template>

        <div class="directory-filters">
          <AppInput
            v-model="filters.search"
            type="text"
            label="Search IBAN"
            placeholder="Counterparty IBAN..."
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
          description="This account has no transactions matching the current filters."
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
.left-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-results {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.search-empty {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.search-result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.6);
}

.search-result-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.search-result-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.search-result-iban {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  letter-spacing: 0.03em;
}

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
