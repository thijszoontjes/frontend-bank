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
import { useApprovalStore } from '@/stores/approval'
import type { ApprovalPayload } from '@/types/approval'
import type { BankAccount } from '@/types/account'
import type { UserProfile } from '@/types/user'
import { formatDateTime, toErrorMessage } from '@/utils/format'

const approvalStore = useApprovalStore()
const selectedUserId = ref<string | null>(null)
const selectedUser = ref<UserProfile | null>(null)
const selectedAccounts = ref<BankAccount[]>([])
const detailLoading = ref(false)
const detailError = ref('')
const actionError = ref('')
const actionMessage = ref('')
const activeAction = ref<string | null>(null)

const limitForm = reactive({
  checkingAbsolute: '-500',
  checkingDaily: '1000',
  savingsAbsolute: '0',
  savingsDaily: '5000',
})

const selectedUserLabel = computed(() =>
  selectedUser.value ? `${selectedUser.value.firstName} ${selectedUser.value.lastName}` : '',
)

function buildPayload(): ApprovalPayload | null {
  const payload: ApprovalPayload = {
    checkingAccount: {
      absoluteLimit: Number(limitForm.checkingAbsolute),
      dailyLimit: Number(limitForm.checkingDaily),
    },
    savingsAccount: {
      absoluteLimit: Number(limitForm.savingsAbsolute),
      dailyLimit: Number(limitForm.savingsDaily),
    },
  }

  const values = [
    payload.checkingAccount.absoluteLimit,
    payload.checkingAccount.dailyLimit,
    payload.savingsAccount.absoluteLimit,
    payload.savingsAccount.dailyLimit,
  ]

  if (values.some((value) => Number.isNaN(value))) {
    actionError.value = 'Enter valid numeric limits.'
    return null
  }

  return payload
}

async function loadApprovals(page = approvalStore.pagination?.page ?? 0) {
  await approvalStore.load(page)

  if (selectedUserId.value && !approvalStore.approvals.some((approval) => approval.id === selectedUserId.value)) {
    selectedUserId.value = null
    selectedUser.value = null
    selectedAccounts.value = []
    actionMessage.value = ''
    actionError.value = ''
  }
}

async function loadUserDetail(userId: string) {
  selectedUserId.value = userId
  detailLoading.value = true
  detailError.value = ''
  actionError.value = ''
  actionMessage.value = ''

  try {
    const user = await services.user.getUserById(userId)
    selectedUser.value = user

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

async function handleApprove() {
  if (!selectedUser.value) {
    return
  }

  const reviewedUserId = selectedUser.value.id
  const payload = buildPayload()

  if (!payload) {
    return
  }

  activeAction.value = 'approve'
  actionError.value = ''

  try {
    await approvalStore.approve(reviewedUserId, payload)
    await loadApprovals()
    await loadUserDetail(reviewedUserId)
    actionMessage.value = 'Customer approved.'
  } catch (caughtError) {
    actionError.value = toErrorMessage(caughtError)
  } finally {
    activeAction.value = null
  }
}

async function handleReject() {
  if (!selectedUser.value) {
    return
  }

  const reviewedUserId = selectedUser.value.id
  activeAction.value = 'reject'
  actionError.value = ''

  try {
    await approvalStore.reject(reviewedUserId)
    await loadApprovals()
    await loadUserDetail(reviewedUserId)
    actionMessage.value = 'Registration rejected.'
  } catch (caughtError) {
    actionError.value = toErrorMessage(caughtError)
  } finally {
    activeAction.value = null
  }
}

onMounted(() => void loadApprovals())
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Approvals"
      description="Review pending registrations and create accounts."
    >
      <template #actions>
        <AppButton variant="secondary" @click="loadApprovals()">Refresh</AppButton>
      </template>
    </PageHeader>

    <LoadingState
      v-if="approvalStore.isLoading && approvalStore.approvals.length === 0"
      label="Loading pending users..."
    />

    <template v-else>
      <div class="grid-two">
        <AppCard title="Pending customers">
          <EmptyState
            v-if="approvalStore.approvals.length === 0"
            title="No pending users"
            description="There are currently no customers waiting for review."
          />

          <div v-else class="stack-sm">
            <div
              v-for="approval in approvalStore.approvals"
              :key="approval.id"
              class="helper-item"
              style="align-items: start;"
            >
              <div style="display: grid; gap: 0.35rem;">
                <strong>{{ approval.firstName }} {{ approval.lastName }}</strong>
                <span style="color: var(--color-text-muted); font-size: 0.92rem;">{{ approval.email }}</span>
                <span style="color: var(--color-text-muted); font-size: 0.92rem;">
                  {{ approval.createdAt ? formatDateTime(approval.createdAt) : 'Unknown' }}
                </span>
              </div>
              <AppButton variant="secondary" size="sm" @click="loadUserDetail(approval.id)">Open</AppButton>
            </div>
          </div>

          <template #actions>
            <div class="button-group" v-if="approvalStore.pagination">
              <AppButton
                variant="secondary"
                size="sm"
                :disabled="!approvalStore.hasPreviousPage || approvalStore.isLoading"
                @click="loadApprovals((approvalStore.pagination?.page ?? 0) - 1)"
              >
                Previous
              </AppButton>
              <AppButton
                variant="secondary"
                size="sm"
                :disabled="!approvalStore.hasNextPage || approvalStore.isLoading"
                @click="loadApprovals((approvalStore.pagination?.page ?? 0) + 1)"
              >
                Next
              </AppButton>
            </div>
          </template>
        </AppCard>

        <AppCard
          title="Details"
          :subtitle="selectedUserLabel || 'Select a pending user'"
        >
          <LoadingState v-if="detailLoading" label="Loading user details..." />

          <EmptyState
            v-else-if="!selectedUser"
            title="No user selected"
            description="Select a pending customer on the left."
          />

          <template v-else>
            <div class="stack-sm">
              <div class="row-between">
                <span>Status</span>
                <AppBadge variant="warning">{{ selectedUser.approvalStatus }}</AppBadge>
              </div>
              <div class="row-between">
                <span>Email</span>
                <strong>{{ selectedUser.email }}</strong>
              </div>
              <div class="row-between">
                <span>Phone</span>
                <strong>{{ selectedUser.phoneNumber ?? 'Not available' }}</strong>
              </div>
              <div class="row-between">
                <span>BSN</span>
                <strong>{{ selectedUser.bsn ?? 'Not available' }}</strong>
              </div>
            </div>

            <div class="stack-sm" style="margin-top: 1rem;">
              <div class="inline-form-row">
                <AppInput v-model="limitForm.checkingAbsolute" label="Checking absolute limit" />
                <AppInput v-model="limitForm.checkingDaily" label="Checking daily limit" />
              </div>
              <div class="inline-form-row">
                <AppInput v-model="limitForm.savingsAbsolute" label="Savings absolute limit" />
                <AppInput v-model="limitForm.savingsDaily" label="Savings daily limit" />
              </div>
            </div>

            <div class="stack-sm" style="margin-top: 1rem;">
              <div class="row-between">
                <span>Accounts</span>
                <strong>{{ selectedAccounts.length }}</strong>
              </div>
              <span style="color: var(--color-text-muted); font-size: 0.92rem;">
                Pending customers normally do not have any accounts yet.
              </span>
              <span v-if="detailError" class="input-error">{{ detailError }}</span>
              <span v-if="actionError" class="input-error">{{ actionError }}</span>
              <span v-if="actionMessage" style="color: var(--color-success);">{{ actionMessage }}</span>
            </div>
          </template>

          <template #actions>
            <div class="button-group" v-if="selectedUser?.approvalStatus === 'pending'">
              <AppButton :disabled="activeAction === 'approve'" @click="handleApprove()">
                {{ activeAction === 'approve' ? 'Approving...' : 'Approve' }}
              </AppButton>
              <AppButton variant="danger" :disabled="activeAction === 'reject'" @click="handleReject()">
                {{ activeAction === 'reject' ? 'Rejecting...' : 'Reject' }}
              </AppButton>
            </div>
          </template>
        </AppCard>
      </div>
    </template>
  </div>
</template>
