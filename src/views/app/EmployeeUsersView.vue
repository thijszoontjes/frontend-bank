<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { services } from '@/services'
import type { BankAccount } from '@/types/account'
import type { PageMetadata } from '@/types/common'
import type { UserListFilters, UserProfile, UserUpdatePayload } from '@/types/user'
import { formatCurrency, formatDateTime, toErrorMessage } from '@/utils/format'

type FilterValue = 'all' | 'yes' | 'no'
type RoleFilterValue = 'all' | 'customer' | 'employee'
type ApprovalFilterValue = 'all' | 'pending' | 'approved' | 'rejected'

const pageSize = 15

const router = useRouter()
const users = ref<UserProfile[]>([])
const pagination = ref<PageMetadata | null>(null)
const listLoading = ref(false)
const listError = ref('')
const selectedUser = ref<UserProfile | null>(null)
const selectedAccounts = ref<BankAccount[]>([])
const detailLoading = ref(false)
const detailError = ref('')
const actionError = ref('')
const actionMessage = ref('')
const activeAction = ref<string | null>(null)
const isDetailModalOpen = ref(false)

const filters = reactive<{
  role: RoleFilterValue
  approvalStatus: ApprovalFilterValue
  blocked: FilterValue
  employeeCreated: FilterValue
  includeDeleted: 'yes' | 'no'
}>({
  role: 'customer',
  approvalStatus: 'all',
  blocked: 'all',
  employeeCreated: 'all',
  includeDeleted: 'no',
})

const editForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
})

const limitForm = reactive({
  checkingAbsolute: '',
  checkingDaily: '',
  savingsAbsolute: '',
  savingsDaily: '',
})

function parseToggle(value: FilterValue) {
  if (value === 'all') {
    return undefined
  }

  return value === 'yes'
}

function buildFilters(): UserListFilters {
  return {
    role: filters.role === 'all' ? undefined : filters.role,
    approvalStatus: filters.approvalStatus === 'all' ? undefined : filters.approvalStatus,
    blocked: parseToggle(filters.blocked),
    employeeCreated: parseToggle(filters.employeeCreated),
    includeDeleted: filters.includeDeleted === 'yes',
  }
}

function syncEditForm(user: UserProfile) {
  editForm.firstName = user.firstName
  editForm.lastName = user.lastName
  editForm.email = user.email
  editForm.phoneNumber = user.phoneNumber ?? ''
}

function syncLimitForm(accounts: BankAccount[]) {
  const checkingAccount = accounts.find((account) => account.type === 'checking')
  const savingsAccount = accounts.find((account) => account.type === 'savings')

  limitForm.checkingAbsolute = checkingAccount?.absoluteLimit?.toString() ?? ''
  limitForm.checkingDaily = checkingAccount?.dailyLimit?.toString() ?? ''
  limitForm.savingsAbsolute = savingsAccount?.absoluteLimit?.toString() ?? ''
  limitForm.savingsDaily = savingsAccount?.dailyLimit?.toString() ?? ''
}

function buildAccountPayload() {
  const checkingAbsolute = Number(limitForm.checkingAbsolute)
  const checkingDaily = Number(limitForm.checkingDaily)
  const savingsAbsolute = Number(limitForm.savingsAbsolute)
  const savingsDaily = Number(limitForm.savingsDaily)
  const fields = [
    limitForm.checkingAbsolute,
    limitForm.checkingDaily,
    limitForm.savingsAbsolute,
    limitForm.savingsDaily,
  ]
  const values = [checkingAbsolute, checkingDaily, savingsAbsolute, savingsDaily]

  if (fields.some((value) => value.trim() === '') || !values.every(Number.isFinite)) {
    actionError.value = 'Use valid numeric account limits.'
    return null
  }

  if (checkingDaily < 0 || savingsDaily < 0) {
    actionError.value = 'Daily limits cannot be negative.'
    return null
  }

  return {
    checkingAccount: {
      absoluteLimit: checkingAbsolute,
      dailyLimit: checkingDaily,
    },
    savingsAccount: {
      absoluteLimit: savingsAbsolute,
      dailyLimit: savingsDaily,
    },
  }
}

function updateUserInList(nextUser: UserProfile) {
  users.value = users.value.map((entry) => (entry.id === nextUser.id ? nextUser : entry))
}

const pageSummary = computed(() => {
  if (!pagination.value || pagination.value.totalElements === 0) {
    return '0 users'
  }

  const start = (pagination.value.page ?? 0) * (pagination.value.size ?? pageSize) + 1
  const end = Math.min(start + users.value.length - 1, pagination.value.totalElements)

  return `${start}-${end} of ${pagination.value.totalElements} users`
})

function statusVariant(user: UserProfile) {
  if (user.deletedAt) {
    return 'danger'
  }

  if (user.blocked || user.approvalStatus === 'rejected') {
    return 'danger'
  }

  if (user.approvalStatus === 'pending') {
    return 'warning'
  }

  return 'success'
}

function statusLabel(user: UserProfile) {
  if (user.deletedAt) {
    return 'Deleted'
  }

  if (user.blocked) {
    return 'Blocked'
  }

  switch (user.approvalStatus) {
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    default:
      return 'Pending'
  }
}

async function loadUsers(page = 0) {
  listLoading.value = true
  listError.value = ''

  try {
    const result = await services.user.listUsers(page, pageSize, buildFilters())
    users.value = result.items
    pagination.value = result.page
  } catch (caughtError) {
    listError.value = toErrorMessage(caughtError)
  } finally {
    listLoading.value = false
  }
}

async function loadUserDetail(userId: string) {
  detailLoading.value = true
  detailError.value = ''
  actionError.value = ''
  actionMessage.value = ''

  try {
    const user = await services.user.getUserById(userId)
    selectedUser.value = user
    syncEditForm(user)

    if (!user.approved || user.deletedAt) {
      selectedAccounts.value = []
      syncLimitForm([])
      return
    }

    try {
      const portfolio = await services.account.getAccountPortfolio(userId)
      selectedAccounts.value = portfolio.accounts
      syncLimitForm(portfolio.accounts)
    } catch {
      selectedAccounts.value = []
      syncLimitForm([])
    }
  } catch (caughtError) {
    selectedUser.value = null
    selectedAccounts.value = []
    syncLimitForm([])
    detailError.value = toErrorMessage(caughtError)
  } finally {
    detailLoading.value = false
  }
}

async function openUserDetail(userId: string) {
  isDetailModalOpen.value = true
  await loadUserDetail(userId)
}

function closeUserDetail() {
  if (activeAction.value) {
    return
  }

  isDetailModalOpen.value = false
}

async function refreshCurrentPage() {
  await loadUsers(pagination.value?.page ?? 0)
}

async function handleSave() {
  if (!selectedUser.value) {
    return
  }

  if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim() || !editForm.phoneNumber.trim()) {
    actionError.value = 'Enter first name, last name, email, and phone number.'
    return
  }

  const payload: UserUpdatePayload = {
    firstName: editForm.firstName.trim(),
    lastName: editForm.lastName.trim(),
    email: editForm.email.trim(),
    phoneNumber: editForm.phoneNumber.trim(),
  }

  if (selectedAccounts.value.length > 0) {
    const accountPayload = buildAccountPayload()

    if (!accountPayload) {
      return
    }

    payload.checkingAccount = accountPayload.checkingAccount
    payload.savingsAccount = accountPayload.savingsAccount
  }

  activeAction.value = 'save'
  actionError.value = ''
  actionMessage.value = ''

  try {
    const updatedUser = await services.user.updateUser(selectedUser.value.id, payload)
    selectedUser.value = updatedUser
    updateUserInList(updatedUser)
    if (selectedAccounts.value.length > 0) {
      const portfolio = await services.account.getAccountPortfolio(selectedUser.value.id)
      selectedAccounts.value = portfolio.accounts
      syncLimitForm(portfolio.accounts)
    }
    actionMessage.value = 'User details updated.'
  } catch (caughtError) {
    actionError.value = toErrorMessage(caughtError)
  } finally {
    activeAction.value = null
  }
}

async function handleBlock() {
  if (!selectedUser.value || !window.confirm('Are you sure you want to block this user?')) {
    return
  }

  activeAction.value = 'block'
  actionError.value = ''
  actionMessage.value = ''

  try {
    const updatedUser = await services.user.blockUser(selectedUser.value.id)
    selectedUser.value = updatedUser
    updateUserInList(updatedUser)
    actionMessage.value = 'User blocked.'
  } catch (caughtError) {
    actionError.value = toErrorMessage(caughtError)
  } finally {
    activeAction.value = null
  }
}

async function handleUnblock() {
  if (!selectedUser.value || !window.confirm('Are you sure you want to unblock this user?')) {
    return
  }

  activeAction.value = 'unblock'
  actionError.value = ''
  actionMessage.value = ''

  try {
    const updatedUser = await services.user.unblockUser(selectedUser.value.id)
    selectedUser.value = updatedUser
    updateUserInList(updatedUser)
    actionMessage.value = 'User unblocked.'
  } catch (caughtError) {
    actionError.value = toErrorMessage(caughtError)
  } finally {
    activeAction.value = null
  }
}

async function handleDelete() {
  if (!selectedUser.value || !window.confirm('Are you sure you want to soft delete this user?')) {
    return
  }

  activeAction.value = 'delete'
  actionError.value = ''
  actionMessage.value = ''

  try {
    await services.user.softDeleteUser(selectedUser.value.id)
    actionMessage.value = 'User soft deleted.'
    await refreshCurrentPage()
    await loadUserDetail(selectedUser.value.id)
  } catch (caughtError) {
    actionError.value = toErrorMessage(caughtError)
  } finally {
    activeAction.value = null
  }
}

onMounted(() => void loadUsers())
</script>

<template>
  <div class="page-stack">
    <PageHeader title="Users" description="Manage customers and employees from one scalable employee overview.">
      <template #actions>
        <AppButton variant="secondary" @click="refreshCurrentPage()">Refresh</AppButton>
      </template>
    </PageHeader>

    <AppCard title="User directory" :subtitle="pageSummary">
      <template #actions>
        <div class="directory-actions">
          <AppButton variant="secondary" size="sm" :disabled="listLoading" @click="loadUsers(0)">Apply filters</AppButton>
        </div>
      </template>

      <div class="directory-filters">
        <label class="input-group">
          <span class="input-label">Role</span>
          <select v-model="filters.role" class="input-control">
            <option value="all">All</option>
            <option value="customer">Customer</option>
            <option value="employee">Employee</option>
          </select>
        </label>
        <label class="input-group">
          <span class="input-label">Approval</span>
          <select v-model="filters.approvalStatus" class="input-control">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label class="input-group">
          <span class="input-label">Blocked</span>
          <select v-model="filters.blocked" class="input-control">
            <option value="all">All</option>
            <option value="yes">Blocked</option>
            <option value="no">Not blocked</option>
          </select>
        </label>
        <label class="input-group">
          <span class="input-label">Created by employee</span>
          <select v-model="filters.employeeCreated" class="input-control">
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label class="input-group">
          <span class="input-label">Deleted users</span>
          <select v-model="filters.includeDeleted" class="input-control">
            <option value="no">Hide</option>
            <option value="yes">Show</option>
          </select>
        </label>
      </div>

      <span v-if="listError" class="input-error directory-error">{{ listError }}</span>

      <LoadingState v-if="listLoading && users.length === 0" label="Loading users..." />

      <EmptyState
        v-else-if="users.length === 0"
        title="No users found"
        description="Adjust the filters or refresh the list."
      />

      <div v-else class="users-table-shell" :class="{ 'is-refreshing': listLoading }">
        <div class="users-table-wrap">
          <table class="table users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Phone</th>
                <th>Created</th>
                <th class="users-table-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in users"
                :key="user.id"
                class="user-row"
                tabindex="0"
                @click="openUserDetail(user.id)"
                @keydown.enter="openUserDetail(user.id)"
              >
                <td>
                  <div class="user-cell">
                    <span class="user-avatar">{{ user.initials }}</span>
                    <span>
                      <strong>{{ user.firstName }} {{ user.lastName }}</strong>
                      <small>{{ user.email }}</small>
                    </span>
                  </div>
                </td>
                <td>
                  <AppBadge :variant="user.role === 'employee' ? 'info' : 'neutral'">{{ user.role }}</AppBadge>
                </td>
                <td>
                  <AppBadge :variant="statusVariant(user)">{{ statusLabel(user) }}</AppBadge>
                </td>
                <td>{{ user.phoneNumber || '-' }}</td>
                <td>{{ user.createdAt ? formatDateTime(user.createdAt) : 'Unknown' }}</td>
                <td>
                  <div class="row-actions">
                    <AppButton
                      v-if="user.role === 'customer'"
                      variant="secondary"
                      size="sm"
                      @click.stop="router.push({ name: 'customer-transactions', params: { userId: user.id } })"
                    >
                      Transactions
                    </AppButton>
                    <AppButton variant="secondary" size="sm" @click.stop="openUserDetail(user.id)">Edit</AppButton>
                  </div>
                </td>
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
              @click="loadUsers((pagination.page ?? 0) - 1)"
            >
              Previous
            </AppButton>
            <AppButton
              variant="secondary"
              size="sm"
              :disabled="listLoading || (pagination.page ?? 0) + 1 >= (pagination.totalPages ?? 1)"
              @click="loadUsers((pagination.page ?? 0) + 1)"
            >
              Next
            </AppButton>
          </div>
        </div>
      </div>

      <div v-if="users.length === 0 && pagination" class="table-footer">
        <span>{{ pageSummary }}</span>
        <div class="button-group">
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="listLoading || (pagination.page ?? 0) === 0"
            @click="loadUsers((pagination.page ?? 0) - 1)"
          >
            Previous
          </AppButton>
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="listLoading || (pagination.page ?? 0) + 1 >= (pagination.totalPages ?? 1)"
            @click="loadUsers((pagination.page ?? 0) + 1)"
          >
            Next
          </AppButton>
        </div>
      </div>
    </AppCard>

    <div v-if="isDetailModalOpen" class="modal-backdrop" @click.self="closeUserDetail()">
      <section class="user-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
        <header class="modal-header">
          <div>
            <span class="modal-eyebrow">User details</span>
            <h3 id="user-modal-title">
              {{ selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Loading user' }}
            </h3>
          </div>
          <button class="modal-close" type="button" aria-label="Close user details" @click="closeUserDetail()">x</button>
        </header>

        <LoadingState v-if="detailLoading" label="Loading user details..." />

        <EmptyState
          v-else-if="!selectedUser"
          title="Unable to load user"
          :description="detailError || 'Try opening the user again.'"
        />

        <div v-else class="modal-content">
          <section class="modal-panel">
            <div class="detail-heading">
              <span class="user-avatar user-avatar--large">{{ selectedUser.initials }}</span>
              <div>
                <strong>{{ selectedUser.firstName }} {{ selectedUser.lastName }}</strong>
                <span>{{ selectedUser.email }}</span>
              </div>
            </div>

            <div class="badge-row">
              <AppBadge :variant="selectedUser.role === 'employee' ? 'info' : 'neutral'">{{ selectedUser.role }}</AppBadge>
              <AppBadge :variant="statusVariant(selectedUser)">{{ statusLabel(selectedUser) }}</AppBadge>
            </div>

            <div class="detail-list">
              <div>
                <span>BSN</span>
                <strong>{{ selectedUser.bsn || '-' }}</strong>
              </div>
              <div>
                <span>Created</span>
                <strong>{{ selectedUser.createdAt ? formatDateTime(selectedUser.createdAt) : 'Unknown' }}</strong>
              </div>
              <div>
                <span>Employee created</span>
                <strong>{{ selectedUser.employeeCreated ? 'Yes' : 'No' }}</strong>
              </div>
            </div>

            <div class="accounts-list">
              <h4>Accounts</h4>
              <EmptyState
                v-if="selectedAccounts.length === 0"
                title="No accounts"
                description="There are no accounts available for this user."
              />
              <div v-else class="stack-sm">
                <div v-for="account in selectedAccounts" :key="account.id" class="account-item">
                  <div>
                    <strong>{{ account.name }}</strong>
                    <span>{{ account.iban }}</span>
                  </div>
                  <div>
                    <strong>{{ formatCurrency(account.availableBalance, account.currency) }}</strong>
                    <span>Daily {{ formatCurrency(account.dailyLimit ?? 0, account.currency) }}</span>
                    <span>Absolute {{ formatCurrency(account.absoluteLimit ?? 0, account.currency) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="modal-panel modal-panel--form">
            <h4>Edit user</h4>
            <div class="inline-form-row">
              <AppInput v-model="editForm.firstName" label="First name" />
              <AppInput v-model="editForm.lastName" label="Last name" />
            </div>
            <div class="inline-form-row">
              <AppInput v-model="editForm.email" label="Email" type="email" />
              <AppInput v-model="editForm.phoneNumber" label="Phone number" />
            </div>
            <template v-if="selectedAccounts.length > 0">
              <h4>Account limits</h4>
              <div class="inline-form-row">
                <AppInput v-model="limitForm.checkingAbsolute" label="Checking absolute limit" type="number" />
                <AppInput v-model="limitForm.checkingDaily" label="Checking daily limit" type="number" />
              </div>
              <div class="inline-form-row">
                <AppInput v-model="limitForm.savingsAbsolute" label="Savings absolute limit" type="number" />
                <AppInput v-model="limitForm.savingsDaily" label="Savings daily limit" type="number" />
              </div>
            </template>

            <div class="modal-actions">
              <AppButton variant="secondary" :disabled="activeAction === 'save'" @click="handleSave()">
                {{ activeAction === 'save' ? 'Saving...' : 'Save changes' }}
              </AppButton>
              <AppButton
                v-if="!selectedUser.blocked && !selectedUser.deletedAt"
                variant="danger"
                :disabled="activeAction === 'block'"
                @click="handleBlock()"
              >
                {{ activeAction === 'block' ? 'Blocking...' : 'Block' }}
              </AppButton>
              <AppButton
                v-if="selectedUser.blocked && !selectedUser.deletedAt"
                variant="secondary"
                :disabled="activeAction === 'unblock'"
                @click="handleUnblock()"
              >
                {{ activeAction === 'unblock' ? 'Unblocking...' : 'Unblock' }}
              </AppButton>
              <AppButton
                v-if="!selectedUser.deletedAt"
                variant="ghost"
                :disabled="activeAction === 'delete'"
                @click="handleDelete()"
              >
                {{ activeAction === 'delete' ? 'Deleting...' : 'Soft delete' }}
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

.users-table-shell {
  display: grid;
  gap: 1rem;
}

.users-table-shell.is-refreshing {
  opacity: 0.74;
}

.users-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.58);
}

.users-table {
  min-width: 960px;
}

.users-table th,
.users-table td {
  white-space: nowrap;
}

.users-table .users-table-actions {
  text-align: right;
}

.users-table td:last-child {
  text-align: right;
}

.user-row {
  cursor: pointer;
}

.user-row:focus {
  outline: 3px solid rgba(142, 205, 183, 0.55);
  outline-offset: -3px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 16rem;
}

.user-cell span:last-child {
  display: grid;
  gap: 0.2rem;
}

.user-cell small,
.detail-heading span,
.detail-list span,
.account-item span,
.table-footer span,
.modal-eyebrow {
  color: var(--color-text-muted);
}

.user-avatar {
  width: 2.6rem;
  height: 2.6rem;
  flex: 0 0 auto;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 800;
}

.user-avatar--large {
  width: 3.5rem;
  height: 3.5rem;
}

.row-actions {
  display: inline-flex;
  gap: 0.5rem;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

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

.user-modal {
  width: min(100%, 68rem);
  max-height: min(88vh, 56rem);
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
  font-size: 1.35rem;
}

.modal-eyebrow {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
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
  grid-template-columns: minmax(18rem, 0.85fr) minmax(0, 1.35fr);
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

.detail-heading div,
.detail-list,
.accounts-list,
.account-item div {
  display: grid;
  gap: 0.3rem;
}

.badge-row,
.modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.detail-list {
  gap: 0.6rem;
}

.detail-list div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--color-border);
}

.account-item {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem;
  border-radius: var(--radius-sm);
  background: #ffffff;
}

.account-item div:last-child {
  text-align: right;
}

.success-message {
  color: var(--color-success);
}

@media (max-width: 1100px) {
  .directory-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .modal-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .directory-filters,
  .modal-content {
    grid-template-columns: 1fr;
  }

  .modal-backdrop {
    padding: 0.75rem;
  }

  .table-footer,
  .account-item,
  .detail-list div {
    align-items: flex-start;
    flex-direction: column;
  }

  .account-item div:last-child {
    text-align: left;
  }
}
</style>
