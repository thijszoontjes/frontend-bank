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

interface LimitFormState {
  checkingAbsolute: string
  checkingDaily: string
  savingsAbsolute: string
  savingsDaily: string
}

const approvalStore = useApprovalStore()
const activeAction = ref<string | null>(null)
const selectedUserId = ref<string | null>(null)
const selectedUser = ref<UserProfile | null>(null)
const selectedAccounts = ref<BankAccount[]>([])
const detailLoading = ref(false)
const detailError = ref('')
const rowErrors = reactive<Record<string, string>>({})
const limitForms = reactive<Record<string, LimitFormState>>({})

const selectedUserLabel = computed(() =>
  selectedUser.value ? `${selectedUser.value.firstName} ${selectedUser.value.lastName}` : '',
)

function ensureForm(userId: string) {
  if (!limitForms[userId]) {
    limitForms[userId] = {
      checkingAbsolute: '-500',
      checkingDaily: '1000',
      savingsAbsolute: '0',
      savingsDaily: '5000',
    }
  }

  return limitForms[userId]
}

function buildPayload(userId: string): ApprovalPayload | null {
  const form = ensureForm(userId)
  const payload: ApprovalPayload = {
    checkingAccount: {
      absoluteLimit: Number(form.checkingAbsolute),
      dailyLimit: Number(form.checkingDaily),
    },
    savingsAccount: {
      absoluteLimit: Number(form.savingsAbsolute),
      dailyLimit: Number(form.savingsDaily),
    },
  }

  const values = [
    payload.checkingAccount.absoluteLimit,
    payload.checkingAccount.dailyLimit,
    payload.savingsAccount.absoluteLimit,
    payload.savingsAccount.dailyLimit,
  ]

  if (values.some((value) => Number.isNaN(value))) {
    rowErrors[userId] = 'Vul geldige numerieke limieten in voor beide accounts.'
    return null
  }

  rowErrors[userId] = ''
  return payload
}

async function loadApprovals(page = approvalStore.pagination?.page ?? 0) {
  await approvalStore.load(page)
  approvalStore.approvals.forEach((approval) => ensureForm(approval.id))

  if (selectedUserId.value && !approvalStore.approvals.some((approval) => approval.id === selectedUserId.value)) {
    selectedUserId.value = null
    selectedUser.value = null
    selectedAccounts.value = []
  }
}

async function loadUserDetail(userId: string) {
  selectedUserId.value = userId
  detailLoading.value = true
  detailError.value = ''

  try {
    const [user, portfolio] = await Promise.all([
      services.user.getUserById(userId),
      services.account.getAccountPortfolio(userId),
    ])

    selectedUser.value = user
    selectedAccounts.value = portfolio.accounts
  } catch (caughtError) {
    selectedUser.value = null
    selectedAccounts.value = []
    detailError.value = toErrorMessage(caughtError)
  } finally {
    detailLoading.value = false
  }
}

async function handleApprove(userId: string) {
  const payload = buildPayload(userId)

  if (!payload) {
    return
  }

  activeAction.value = `${userId}:approve`

  try {
    await approvalStore.approve(userId, payload)
    await loadApprovals()
  } catch (caughtError) {
    rowErrors[userId] = toErrorMessage(caughtError)
  } finally {
    activeAction.value = null
  }
}

async function handleReject(userId: string) {
  rowErrors[userId] = ''
  activeAction.value = `${userId}:reject`

  try {
    await approvalStore.reject(userId)
    await loadApprovals()
  } catch (caughtError) {
    rowErrors[userId] = toErrorMessage(caughtError)
  } finally {
    activeAction.value = null
  }
}

async function handleSoftDelete(userId: string) {
  if (!window.confirm('Weet je zeker dat je deze user soft wilt verwijderen?')) {
    return
  }

  activeAction.value = `${userId}:delete`
  rowErrors[userId] = ''

  try {
    await services.user.softDeleteUser(userId)
    await loadApprovals()
  } catch (caughtError) {
    rowErrors[userId] = toErrorMessage(caughtError)
  } finally {
    activeAction.value = null
  }
}

onMounted(() => void loadApprovals())
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="User management"
      description="Deze pagina gebruikt alleen de huidige backend-support: pending customers, user detail, approval, reject en soft delete."
    >
      <template #actions>
        <AppButton variant="secondary" @click="loadApprovals()">Verversen</AppButton>
      </template>
    </PageHeader>

    <div class="grid-three">
      <AppCard title="Ondersteund" subtitle="Beschikbaar in de huidige backend.">
        <div class="stack-sm">
          <span>Pending users bekijken</span>
          <span>User detail ophalen</span>
          <span>Approve, reject en soft delete</span>
        </div>
      </AppCard>
      <AppCard title="Niet ondersteund" subtitle="Geen endpoint gevonden in backend/OpenAPI.">
        <div class="stack-sm">
          <span>Employee-created customer</span>
          <span>Userinformatie updaten</span>
          <span>Block / unblock gebruiker</span>
        </div>
      </AppCard>
      <AppCard title="Paginatie" subtitle="De lijst gebruikt de bestaande page/size support op pending users.">
        <div class="row-between">
          <span>Totaal pending users</span>
          <strong>{{ approvalStore.pendingCount }}</strong>
        </div>
      </AppCard>
    </div>

    <LoadingState
      v-if="approvalStore.isLoading && approvalStore.approvals.length === 0"
      label="Pending users laden..."
    />

    <template v-else>
      <div class="grid-two">
        <AppCard title="Pending customers" subtitle="Alleen users die via het bestaande lijst-endpoint beschikbaar zijn.">
          <EmptyState
            v-if="approvalStore.approvals.length === 0"
            title="Geen pending users"
            description="Er zijn momenteel geen customers die wachten op beoordeling."
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
                  {{ approval.createdAt ? formatDateTime(approval.createdAt) : 'Onbekend' }}
                </span>
              </div>
              <AppButton variant="secondary" size="sm" @click="loadUserDetail(approval.id)">Details</AppButton>
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
                Vorige
              </AppButton>
              <AppButton
                variant="secondary"
                size="sm"
                :disabled="!approvalStore.hasNextPage || approvalStore.isLoading"
                @click="loadApprovals((approvalStore.pagination?.page ?? 0) + 1)"
              >
                Volgende
              </AppButton>
            </div>
          </template>
        </AppCard>

        <AppCard
          title="User detail"
          :subtitle="selectedUserLabel || 'Selecteer een pending user uit de lijst'"
        >
          <LoadingState v-if="detailLoading" label="User detail laden..." />

          <EmptyState
            v-else-if="!selectedUser"
            title="Geen user geselecteerd"
            description="Selecteer links een pending customer om detailinformatie en beheeracties te zien."
          />

          <template v-else>
            <div class="stack-sm">
              <div class="row-between">
                <span>Status</span>
                <AppBadge variant="warning">{{ selectedUser.approvalStatus }}</AppBadge>
              </div>
              <div class="row-between">
                <span>E-mail</span>
                <strong>{{ selectedUser.email }}</strong>
              </div>
              <div class="row-between">
                <span>Telefoon</span>
                <strong>{{ selectedUser.phoneNumber ?? 'Niet beschikbaar' }}</strong>
              </div>
              <div class="row-between">
                <span>BSN</span>
                <strong>{{ selectedUser.bsn ?? 'Niet beschikbaar' }}</strong>
              </div>
              <div class="row-between">
                <span>Aangemaakt</span>
                <strong>{{ selectedUser.createdAt ? formatDateTime(selectedUser.createdAt) : 'Onbekend' }}</strong>
              </div>
            </div>

            <div class="stack-sm" style="margin-top: 1rem;">
              <div class="inline-form-row">
                <AppInput
                  v-model="ensureForm(selectedUser.id).checkingAbsolute"
                  label="Checking absolute limit"
                  placeholder="-500"
                />
                <AppInput
                  v-model="ensureForm(selectedUser.id).checkingDaily"
                  label="Checking daily limit"
                  placeholder="1000"
                />
              </div>
              <div class="inline-form-row">
                <AppInput
                  v-model="ensureForm(selectedUser.id).savingsAbsolute"
                  label="Savings absolute limit"
                  placeholder="0"
                />
                <AppInput
                  v-model="ensureForm(selectedUser.id).savingsDaily"
                  label="Savings daily limit"
                  placeholder="5000"
                />
              </div>
            </div>

            <div class="stack-sm" style="margin-top: 1rem;">
              <div class="row-between">
                <span>Accounts</span>
                <strong>{{ selectedAccounts.length }}</strong>
              </div>
              <span style="color: var(--color-text-muted); font-size: 0.92rem;">
                Pending customers hebben normaal gesproken nog geen accounts.
              </span>
              <span v-if="detailError" class="input-error">{{ detailError }}</span>
              <span v-if="rowErrors[selectedUser.id]" class="input-error">{{ rowErrors[selectedUser.id] }}</span>
            </div>
          </template>

          <template #actions>
            <div class="button-group" v-if="selectedUser">
              <AppButton
                :disabled="activeAction === `${selectedUser.id}:approve` || activeAction === `${selectedUser.id}:reject` || activeAction === `${selectedUser.id}:delete`"
                @click="handleApprove(selectedUser.id)"
              >
                {{ activeAction === `${selectedUser.id}:approve` ? 'Goedkeuren...' : 'Goedkeuren' }}
              </AppButton>
              <AppButton
                variant="danger"
                :disabled="activeAction === `${selectedUser.id}:approve` || activeAction === `${selectedUser.id}:reject` || activeAction === `${selectedUser.id}:delete`"
                @click="handleReject(selectedUser.id)"
              >
                {{ activeAction === `${selectedUser.id}:reject` ? 'Afwijzen...' : 'Afwijzen' }}
              </AppButton>
              <AppButton
                variant="ghost"
                :disabled="activeAction === `${selectedUser.id}:approve` || activeAction === `${selectedUser.id}:reject` || activeAction === `${selectedUser.id}:delete`"
                @click="handleSoftDelete(selectedUser.id)"
              >
                {{ activeAction === `${selectedUser.id}:delete` ? 'Verwijderen...' : 'Soft delete' }}
              </AppButton>
            </div>
          </template>
        </AppCard>
      </div>
    </template>
  </div>
</template>
