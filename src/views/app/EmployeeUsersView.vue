<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
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

const pageSize = 20

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

function updateUserInList(nextUser: UserProfile) {
  users.value = users.value.map((entry) => (entry.id === nextUser.id ? nextUser : entry))
}

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
      return
    }

    try {
      const portfolio = await services.account.getAccountPortfolio(userId)
      selectedAccounts.value = portfolio.accounts
    } catch {
      selectedAccounts.value = []
    }
  } catch (caughtError) {
    selectedUser.value = null
    selectedAccounts.value = []
    detailError.value = toErrorMessage(caughtError)
  } finally {
    detailLoading.value = false
  }
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

  activeAction.value = 'save'
  actionError.value = ''
  actionMessage.value = ''

  try {
    const updatedUser = await services.user.updateUser(selectedUser.value.id, payload)
    selectedUser.value = updatedUser
    updateUserInList(updatedUser)
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
    <PageHeader title="Users" description="Find users and manage their details or status.">
      <template #actions>
        <AppButton variant="secondary" @click="refreshCurrentPage()">Refresh</AppButton>
      </template>
    </PageHeader>

    <div class="grid-two">
      <AppCard title="Filters">
        <div class="grid-two">
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
            <span class="input-label">Employee created</span>
            <select v-model="filters.employeeCreated" class="input-control">
              <option value="all">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label class="input-group">
            <span class="input-label">Include deleted</span>
            <select v-model="filters.includeDeleted" class="input-control">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>
        </div>

        <div class="button-group" style="margin-top: 1rem;">
          <AppButton variant="secondary" :disabled="listLoading" @click="loadUsers(0)">Apply</AppButton>
        </div>
        <span v-if="listError" class="input-error" style="display: block; margin-top: 1rem;">{{ listError }}</span>
      </AppCard>

      <AppCard title="Users">
        <LoadingState v-if="listLoading && users.length === 0" label="Loading users..." />

        <EmptyState
          v-else-if="users.length === 0"
          title="No users found"
          description="Adjust the filters or refresh the list."
        />

        <div v-else class="stack-sm">
          <div
            v-for="user in users"
            :key="user.id"
            class="helper-item"
            style="align-items: start;"
          >
            <div style="display: grid; gap: 0.35rem;">
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
                <strong>{{ user.firstName }} {{ user.lastName }}</strong>
                <AppBadge :variant="user.role === 'employee' ? 'info' : 'neutral'">{{ user.role }}</AppBadge>
                <AppBadge :variant="statusVariant(user)">{{ statusLabel(user) }}</AppBadge>
              </div>
              <span style="color: var(--color-text-muted); font-size: 0.92rem;">{{ user.email }}</span>
              <span style="color: var(--color-text-muted); font-size: 0.92rem;">
                {{ user.createdAt ? formatDateTime(user.createdAt) : 'Unknown' }}
              </span>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <AppButton
                v-if="user.role === 'customer'"
                variant="secondary"
                size="sm"
                @click="router.push({ name: 'customer-transactions', params: { userId: user.id } })"
              >
                View transactions
              </AppButton>
              <AppButton variant="secondary" size="sm" @click="loadUserDetail(user.id)">Open</AppButton>
            </div>
          </div>
        </div>

        <div class="button-group" v-if="pagination" style="margin-top: 1rem;">
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
      </AppCard>
    </div>

    <div class="grid-two">
      <AppCard :title="selectedUser ? 'Details' : 'Details'" :subtitle="selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Select a user'">
        <LoadingState v-if="detailLoading" label="Loading user details..." />

        <EmptyState
          v-else-if="!selectedUser"
          title="No user selected"
          description="Choose a user on the left to view details."
        />

        <div v-else class="stack-sm">
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <AppBadge :variant="selectedUser.role === 'employee' ? 'info' : 'neutral'">{{ selectedUser.role }}</AppBadge>
            <AppBadge :variant="statusVariant(selectedUser)">{{ statusLabel(selectedUser) }}</AppBadge>
          </div>
          <div class="inline-form-row">
            <AppInput v-model="editForm.firstName" label="First name" />
            <AppInput v-model="editForm.lastName" label="Last name" />
          </div>
          <div class="inline-form-row">
            <AppInput v-model="editForm.email" label="Email" type="email" />
            <AppInput v-model="editForm.phoneNumber" label="Phone number" />
          </div>

          <div class="button-group">
            <AppButton variant="secondary" :disabled="activeAction === 'save'" @click="handleSave()">
              {{ activeAction === 'save' ? 'Saving...' : 'Save' }}
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
          <span v-if="actionMessage" style="color: var(--color-success);">{{ actionMessage }}</span>
        </div>
      </AppCard>

      <AppCard title="Accounts">
        <EmptyState
          v-if="!selectedUser"
          title="No user selected"
          description="Select a user first."
        />
        <EmptyState
          v-else-if="selectedAccounts.length === 0"
          title="No accounts"
          description="There are no accounts available for this user."
        />
        <div v-else class="stack-sm">
          <div v-for="account in selectedAccounts" :key="account.id" class="helper-item" style="align-items: start;">
            <div style="display: grid; gap: 0.35rem;">
              <strong>{{ account.name }}</strong>
              <span style="color: var(--color-text-muted); font-size: 0.92rem;">{{ account.iban }}</span>
            </div>
            <div style="display: grid; gap: 0.2rem; text-align: right;">
              <strong>{{ formatCurrency(account.availableBalance, account.currency) }}</strong>
              <span style="color: var(--color-text-muted); font-size: 0.92rem;">
                Daily {{ formatCurrency(account.dailyLimit ?? 0, account.currency) }}
              </span>
            </div>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
