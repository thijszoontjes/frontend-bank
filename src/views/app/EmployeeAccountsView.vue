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
import type { AccountBalanceOperator, AccountStatus, BankAccount } from '@/types/account'
import type { PageMetadata } from '@/types/common'
import { formatCurrency, formatDate, toErrorMessage } from '@/utils/format'

type AccountTypeFilter = 'all' | 'checking' | 'savings'
type AccountStatusFilter = 'all' | 'active' | 'blocked'
type BalanceOperatorFilter = 'none' | AccountBalanceOperator

const pageSize = 15

const accounts = ref<BankAccount[]>([])
const pagination = ref<PageMetadata | null>(null)
const listLoading = ref(false)
const listError = ref('')

const filters = reactive<{
  type: AccountTypeFilter
  status: AccountStatusFilter
  balanceOperator: BalanceOperatorFilter
  balanceValue: string
  createdAfter: string
}>({
  type: 'all',
  status: 'all',
  balanceOperator: 'none',
  balanceValue: '',
  createdAfter: '',
})

function buildFilters() {
  return {
    type: filters.type === 'all' ? undefined : (filters.type as 'checking' | 'savings'),
    status: filters.status === 'all' ? undefined : (filters.status as AccountStatus),
    balanceOperator:
      filters.balanceOperator !== 'none' && filters.balanceValue.trim() !== ''
        ? (filters.balanceOperator as AccountBalanceOperator)
        : undefined,
    balanceValue:
      filters.balanceOperator !== 'none' && filters.balanceValue.trim() !== ''
        ? Number(filters.balanceValue)
        : undefined,
    createdAfter: filters.createdAfter || undefined,
  }
}

const pageSummary = computed(() => {
  if (!pagination.value || pagination.value.totalElements === 0) {
    return '0 accounts'
  }

  const start = (pagination.value.page ?? 0) * (pagination.value.size ?? pageSize) + 1
  const end = Math.min(start + accounts.value.length - 1, pagination.value.totalElements)

  return `${start}–${end} of ${pagination.value.totalElements} accounts`
})

function statusVariant(status: BankAccount['status']) {
  if (status === 'active') return 'success'
  if (status === 'blocked') return 'danger'
  return 'warning'
}

function statusLabel(status: BankAccount['status']) {
  if (status === 'active') return 'Open'
  if (status === 'blocked') return 'Closed'
  return 'Review'
}

function typeLabel(type: BankAccount['type']) {
  if (type === 'checking') return 'Checking'
  if (type === 'savings') return 'Savings'
  return 'Business'
}

async function loadAccounts(page = 0) {
  listLoading.value = true
  listError.value = ''

  try {
    const result = await services.account.listAllAccounts(page, pageSize, buildFilters())
    accounts.value = result.items
    pagination.value = result.page
  } catch (caughtError) {
    listError.value = toErrorMessage(caughtError)
  } finally {
    listLoading.value = false
  }
}

onMounted(() => void loadAccounts())
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Accounts"
      description="Browse and filter all customer accounts across the platform."
    >
      <template #actions>
        <AppButton variant="secondary" @click="loadAccounts(0)">Refresh</AppButton>
      </template>
    </PageHeader>

    <AppCard title="Account directory" :subtitle="pageSummary">
      <template #actions>
        <div class="directory-actions">
          <AppButton variant="secondary" size="sm" :disabled="listLoading" @click="loadAccounts(0)">
            Apply filters
          </AppButton>
        </div>
      </template>

      <div class="directory-filters">
        <label class="input-group">
          <span class="input-label">Account type</span>
          <select v-model="filters.type" class="input-control">
            <option value="all">All types</option>
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
          </select>
        </label>

        <label class="input-group">
          <span class="input-label">Status</span>
          <select v-model="filters.status" class="input-control">
            <option value="all">All statuses</option>
            <option value="active">Open</option>
            <option value="blocked">Closed</option>
          </select>
        </label>

        <label class="input-group">
          <span class="input-label">Balance</span>
          <select v-model="filters.balanceOperator" class="input-control">
            <option value="none">No filter</option>
            <option value="gt">More than</option>
            <option value="eq">Equal to</option>
            <option value="lt">Less than</option>
          </select>
        </label>

        <label class="input-group" :class="{ 'input-group--disabled': filters.balanceOperator === 'none' }">
          <span class="input-label">Balance amount (€)</span>
          <AppInput
            v-model="filters.balanceValue"
            type="number"
            placeholder="0.00"
            :disabled="filters.balanceOperator === 'none'"
          />
        </label>

        <label class="input-group">
          <span class="input-label">Created from</span>
          <input v-model="filters.createdAfter" type="date" class="input-control" />
        </label>
      </div>

      <span v-if="listError" class="input-error directory-error">{{ listError }}</span>

      <LoadingState v-if="listLoading && accounts.length === 0" label="Loading accounts..." />

      <EmptyState
        v-else-if="accounts.length === 0"
        title="No accounts found"
        description="Adjust the filters or refresh the list."
      />

      <div v-else class="accounts-table-shell" :class="{ 'is-refreshing': listLoading }">
        <div class="accounts-table-wrap">
          <table class="table accounts-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>IBAN</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="account in accounts" :key="account.id">
                <td>
                  <div class="account-cell">
                    <span class="account-icon">{{ account.type === 'checking' ? 'CH' : 'SV' }}</span>
                    <span>
                      <strong>{{ account.name }}</strong>
                      <small>{{ account.userId }}</small>
                    </span>
                  </div>
                </td>
                <td class="iban-cell">{{ account.iban }}</td>
                <td>
                  <AppBadge variant="info">{{ typeLabel(account.type) }}</AppBadge>
                </td>
                <td>
                  <strong>{{ formatCurrency(account.availableBalance, account.currency) }}</strong>
                </td>
                <td>
                  <AppBadge :variant="statusVariant(account.status)">
                    {{ statusLabel(account.status) }}
                  </AppBadge>
                </td>
                <td>{{ account.createdAt ? formatDate(account.createdAt) : '–' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="pagination" class="table-footer">
          <span>{{ pageSummary }}</span>
          <div class="button-group">
            <AppButton
              variant="secondary"
              size="sm"
              :disabled="listLoading || (pagination.page ?? 0) === 0"
              @click="loadAccounts((pagination.page ?? 0) - 1)"
            >
              Previous
            </AppButton>
            <AppButton
              variant="secondary"
              size="sm"
              :disabled="listLoading || (pagination.page ?? 0) + 1 >= (pagination.totalPages ?? 1)"
              @click="loadAccounts((pagination.page ?? 0) + 1)"
            >
              Next
            </AppButton>
          </div>
        </div>
      </div>

      <div v-if="accounts.length === 0 && pagination" class="table-footer">
        <span>{{ pageSummary }}</span>
        <div class="button-group">
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="listLoading || (pagination.page ?? 0) === 0"
            @click="loadAccounts((pagination.page ?? 0) - 1)"
          >
            Previous
          </AppButton>
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="listLoading || (pagination.page ?? 0) + 1 >= (pagination.totalPages ?? 1)"
            @click="loadAccounts((pagination.page ?? 0) + 1)"
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

.directory-error {
  display: block;
  margin-bottom: 1rem;
}

.input-group--disabled .input-label {
  opacity: 0.45;
}

.accounts-table-shell {
  display: grid;
  gap: 1rem;
}

.accounts-table-shell.is-refreshing {
  opacity: 0.74;
}

.accounts-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.58);
}

.accounts-table {
  min-width: 860px;
}

.accounts-table th,
.accounts-table td {
  white-space: nowrap;
}

.account-cell {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 14rem;
}

.account-cell span:last-child {
  display: grid;
  gap: 0.2rem;
}

.account-cell small {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.account-icon {
  width: 2.6rem;
  height: 2.6rem;
  flex: 0 0 auto;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 800;
  font-size: 0.7rem;
}

.iban-cell {
  font-family: monospace;
  letter-spacing: 0.04em;
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
