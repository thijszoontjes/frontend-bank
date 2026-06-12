<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

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

const pageSize = 25

const accounts = ref<BankAccount[]>([])
const pagination = ref<PageMetadata | null>(null)
const listLoading = ref(false)
const listError = ref('')

const selectedAccount = ref<BankAccount | null>(null)
const isDetailModalOpen = ref(false)
const detailLoading = ref(false)
const detailError = ref('')
const actionError = ref('')
const actionMessage = ref('')
const activeAction = ref<string | null>(null)

const limitForm = reactive({
  absoluteLimit: '',
  dailyLimit: '',
})

const filters = reactive<{
  type: AccountTypeFilter
  status: AccountStatusFilter
  balanceOperator: BalanceOperatorFilter
  // Vue 3 coerces <input type="number"> to a number at runtime, so '' represents "empty".
  balanceValue: number | ''
  createdAfter: string
}>({
  type: 'all',
  status: 'all',
  balanceOperator: 'none',
  balanceValue: '',
  createdAfter: '',
})

function buildFilters() {
  // balanceValue is '' when the field is empty, or a number when the user has typed a value.
  const hasBalance = filters.balanceOperator !== 'none' && filters.balanceValue !== ''

  return {
    type: filters.type === 'all' ? undefined : (filters.type as 'checking' | 'savings'),
    status: filters.status === 'all' ? undefined : (filters.status as AccountStatus),
    balanceOperator: hasBalance ? (filters.balanceOperator as AccountBalanceOperator) : undefined,
    // balanceValue is already a number — no conversion needed.
    balanceValue: hasBalance ? (filters.balanceValue as number) : undefined,
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

function syncLimitForm(account: BankAccount) {
  limitForm.absoluteLimit = account.absoluteLimit?.toString() ?? ''
  limitForm.dailyLimit = account.dailyLimit?.toString() ?? ''
}

function updateAccountInList(updated: BankAccount) {
  accounts.value = accounts.value.map((a) => (a.iban === updated.iban ? updated : a))
}

async function loadAccounts(page = 0) {
  listLoading.value = true //Visual feedback for loading state
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

async function openAccountDetail(iban: string) {
  isDetailModalOpen.value = true
  detailLoading.value = true
  detailError.value = ''
  actionError.value = ''
  actionMessage.value = ''

  try {
    const account = await services.account.getAccountByIban(iban)
    selectedAccount.value = account
    syncLimitForm(account)
  } catch (caughtError) {
    selectedAccount.value = null
    detailError.value = toErrorMessage(caughtError)
  } finally {
    detailLoading.value = false
  }
}

function closeAccountDetail() {
  if (activeAction.value) return
  isDetailModalOpen.value = false
}

async function handleToggleStatus() {
  if (!selectedAccount.value) return

  activeAction.value = 'status'
  actionError.value = ''
  actionMessage.value = ''

  try {
    const updated = await services.account.updateAccountStatus(selectedAccount.value.iban)
    selectedAccount.value = updated
    syncLimitForm(updated)
    updateAccountInList(updated)
    actionMessage.value = `Account ${updated.status === 'active' ? 'reopened' : 'closed'}.`
  } catch (caughtError) {
    actionError.value = toErrorMessage(caughtError)
  } finally {
    activeAction.value = null
  }
}

async function handleSaveLimits() {
  if (!selectedAccount.value) return

  const absoluteLimit = Number(limitForm.absoluteLimit)
  const dailyLimit = Number(limitForm.dailyLimit)

  if (limitForm.absoluteLimit.trim() === '' || limitForm.dailyLimit.trim() === '') {
    actionError.value = 'Enter both absolute limit and daily limit.'
    return
  }

  if (!Number.isFinite(absoluteLimit) || !Number.isFinite(dailyLimit)) {
    actionError.value = 'Use valid numeric limits.'
    return
  }

  if (dailyLimit < 0) {
    actionError.value = 'Daily limit cannot be negative.'
    return
  }

  activeAction.value = 'limits'
  actionError.value = ''
  actionMessage.value = ''

  try {
    const updated = await services.account.updateAccountLimits(
      selectedAccount.value.iban,
      absoluteLimit,
      dailyLimit,
    )
    selectedAccount.value = updated
    syncLimitForm(updated)
    updateAccountInList(updated)
    actionMessage.value = 'Limits updated.'
  } catch (caughtError) {
    actionError.value = toErrorMessage(caughtError)
  } finally {
    activeAction.value = null
  }
}

watch(
  () => [filters.type, filters.status, filters.balanceOperator, filters.createdAfter] as const,
  () => {
    void loadAccounts(0)
  },
)

watch(
  () => filters.balanceValue,
  () => {
    if (filters.balanceOperator !== 'none' && filters.balanceValue !== '') {
      void loadAccounts(0)
    }
  },
)

onMounted(() => void loadAccounts())
</script>

<template>
  <div class="page-stack manage-accounts-page">
    <PageHeader
      layout="inline"
      title="Accounts"
      description="Browse and filter all customer accounts across the platform. Filters apply automatically."
    >
      <template #actions>
        <AppButton variant="secondary" @click="loadAccounts(pagination?.page ?? 0)">Refresh</AppButton>
      </template>
    </PageHeader>

    <AppCard title="Account directory" class="directory-card">
      <template #actions>
        <span class="directory-summary">{{ pageSummary }}</span>
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
          <input
            v-model="filters.balanceValue"
            type="number"
            placeholder="0.00"
            class="input-control"
            :disabled="filters.balanceOperator === 'none'"
          />
        </label>

        <label class="input-group">
          <span class="input-label">Created from</span>
          <input v-model="filters.createdAfter" type="date" class="input-control" />
        </label>
      </div>

      <span v-if="listError" class="input-error directory-error">{{ listError }}</span>

      <div class="accounts-panel">
        <LoadingState v-if="listLoading && accounts.length === 0" label="Loading accounts..." />

        <EmptyState
          v-else-if="accounts.length === 0"
          title="No accounts found"
          description="Adjust the filters or refresh the list."
        />

        <template v-else>
          <div class="accounts-table-shell" :class="{ 'is-refreshing': listLoading }">
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
                  <tr
                    v-for="account in accounts"
                    :key="account.id"
                    class="account-row"
                    tabindex="0"
                    @click="openAccountDetail(account.iban)"
                    @keydown.enter="openAccountDetail(account.iban)"
                  >
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
          </div>

          <div v-if="pagination" class="table-footer">
            <span>Page {{ (pagination.page ?? 0) + 1 }} of {{ pagination.totalPages ?? 1 }}</span>
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
        </template>
      </div>
    </AppCard>

    <!-- Account detail modal -->
    <div v-if="isDetailModalOpen" class="modal-backdrop" @click.self="closeAccountDetail()">
      <section class="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
        <header class="modal-header">
          <div>
            <span class="modal-eyebrow">Account details</span>
            <h3 id="account-modal-title">
              {{ selectedAccount ? selectedAccount.iban : 'Loading account' }}
            </h3>
          </div>
          <button class="modal-close" type="button" aria-label="Close account details" @click="closeAccountDetail()">x</button>
        </header>

        <LoadingState v-if="detailLoading" label="Loading account details..." />

        <EmptyState
          v-else-if="!selectedAccount"
          title="Unable to load account"
          :description="detailError || 'Try opening the account again.'"
        />

        <div v-else class="modal-content">
          <section class="modal-panel">
            <div class="detail-heading">
              <span class="account-icon account-icon--large">
                {{ selectedAccount.type === 'checking' ? 'CH' : 'SV' }}
              </span>
              <div>
                <strong>{{ selectedAccount.name }}</strong>
                <span v-if="selectedAccount.ownerName">{{ selectedAccount.ownerName }}</span>
                <span>User #{{ selectedAccount.userId }}</span>
              </div>
            </div>

            <div class="badge-row">
              <AppBadge variant="info">{{ typeLabel(selectedAccount.type) }}</AppBadge>
              <AppBadge :variant="statusVariant(selectedAccount.status)">
                {{ statusLabel(selectedAccount.status) }}
              </AppBadge>
            </div>

            <div class="detail-list">
              <div>
                <span>IBAN</span>
                <strong class="iban-cell">{{ selectedAccount.iban }}</strong>
              </div>
              <div>
                <span>Balance</span>
                <strong>{{ formatCurrency(selectedAccount.availableBalance, selectedAccount.currency) }}</strong>
              </div>
              <div>
                <span>Absolute limit</span>
                <strong>{{ formatCurrency(selectedAccount.absoluteLimit ?? 0, selectedAccount.currency) }}</strong>
              </div>
              <div>
                <span>Daily limit</span>
                <strong>{{ formatCurrency(selectedAccount.dailyLimit ?? 0, selectedAccount.currency) }}</strong>
              </div>
              <div>
                <span>Created</span>
                <strong>{{ selectedAccount.createdAt ? formatDate(selectedAccount.createdAt) : '–' }}</strong>
              </div>
            </div>
          </section>

          <section class="modal-panel modal-panel--form">
            <h4>Account limits</h4>
            <div class="inline-form-row">
              <div v-if="selectedAccount.type === 'savings'" class="input-group">
                <span class="input-label">Absolute limit (€)</span>
                <span class="static-value">{{ formatCurrency(0, selectedAccount.currency) }}</span>
              </div>
              <AppInput
                v-else
                v-model="limitForm.absoluteLimit"
                label="Absolute limit (€)"
                type="number"
              />
              <AppInput v-model="limitForm.dailyLimit" label="Daily limit (€)" type="number" />
            </div>

            <div class="modal-actions">
              <AppButton
                variant="secondary"
                :disabled="activeAction === 'limits'"
                @click="handleSaveLimits()"
              >
                {{ activeAction === 'limits' ? 'Saving...' : 'Save limits' }}
              </AppButton>

              <AppButton
                v-if="selectedAccount.status === 'active'"
                variant="danger"
                :disabled="activeAction === 'status'"
                @click="handleToggleStatus()"
              >
                {{ activeAction === 'status' ? 'Closing...' : 'Close account' }}
              </AppButton>

              <AppButton
                v-else
                variant="secondary"
                :disabled="activeAction === 'status'"
                @click="handleToggleStatus()"
              >
                {{ activeAction === 'status' ? 'Reopening...' : 'Reopen account' }}
              </AppButton>
            </div>

            <span v-if="detailError" class="input-error">{{ detailError }}</span>
            <span v-if="actionError" class="input-error">{{ actionError }}</span>
            <span v-if="actionMessage" class="success-message">{{ actionMessage }}</span>
          </section>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.manage-accounts-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.directory-card {
  display: flex;
  flex-direction: column;
}

.directory-card :deep(.card) {
  display: flex;
  flex-direction: column;
}

.directory-card :deep(.card-body) {
  display: flex;
  flex-direction: column;
}

.directory-summary {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  white-space: nowrap;
}

.directory-filters {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.85rem;
  margin-bottom: 0.85rem;
  flex-shrink: 0;
}

.directory-error {
  display: block;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.input-group--disabled .input-label {
  opacity: 0.45;
}

.accounts-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.accounts-table-shell {
  display: flex;
  flex-direction: column;
}

.accounts-table-shell.is-refreshing {
  opacity: 0.74;
}

.accounts-table-wrap {
  /* Fixed height so ~10 rows are always visible and the table scrolls internally.
     The footer (page nav) stays directly below this box and is always reachable. */
  height: 34rem;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.58);
}

.accounts-table {
  min-width: 860px;
}

.accounts-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 1px 0 var(--color-border);
}

.accounts-table th,
.accounts-table td {
  white-space: nowrap;
  /* Compact row padding so ~10 accounts fit in the visible area */
  padding: 0.6rem 1rem;
}

.account-row {
  cursor: pointer;
}

.account-row:focus {
  outline: 3px solid rgba(142, 205, 183, 0.55);
  outline-offset: -3px;
}

.account-row:hover {
  background: rgba(18, 62, 53, 0.04);
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
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 800;
  font-size: 0.65rem;
}

.account-icon--large {
  width: 3rem;
  height: 3rem;
  font-size: 0.75rem;
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
  flex-shrink: 0;
}

.table-footer span {
  color: var(--color-text-muted);
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  padding: 2rem;
  display: grid;
  place-items: center;
  background: rgba(10, 28, 24, 0.46);
  backdrop-filter: blur(8px);
}

.account-modal {
  width: min(100%, 62rem);
  max-height: min(88vh, 52rem);
  overflow: auto;
  border-radius: var(--radius-lg);
  background: var(--color-surface-strong);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
}

.modal-header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0.15rem 0 0;
  font-size: 1.2rem;
  font-family: monospace;
  letter-spacing: 0.04em;
}

.modal-eyebrow {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.modal-close {
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 999px;
  background: rgba(18, 62, 53, 0.08);
  color: var(--color-primary);
  cursor: pointer;
  font-weight: 800;
}

.modal-content {
  display: grid;
  grid-template-columns: minmax(16rem, 0.85fr) minmax(0, 1.35fr);
  gap: 1rem;
  padding: 1.25rem;
}

.modal-panel {
  display: grid;
  align-content: start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(18, 62, 53, 0.035);
}

.modal-panel h4 {
  margin: 0;
}

.modal-panel--form {
  background: #ffffff;
}

.detail-heading {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.detail-heading div {
  display: grid;
  gap: 0.3rem;
}

.detail-heading span {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.badge-row,
.modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.detail-list {
  display: grid;
  gap: 0.6rem;
}

.detail-list div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--color-border);
}

.detail-list span {
  color: var(--color-text-muted);
}

.inline-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.static-value {
  display: block;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.success-message {
  color: var(--color-success);
}

@media (max-width: 1100px) {
  .directory-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .accounts-table-wrap {
    height: 24rem;
  }

  .modal-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .modal-backdrop {
    padding: 0.75rem;
  }

  .inline-form-row {
    grid-template-columns: 1fr;
  }
}
</style>
