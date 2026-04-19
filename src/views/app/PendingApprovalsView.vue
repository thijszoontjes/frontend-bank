<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useApprovalStore } from '@/stores/approval'
import type { ApprovalPayload } from '@/types/approval'
import { formatDateTime, toErrorMessage } from '@/utils/format'

interface LimitFormState {
  checkingAbsolute: string
  checkingDaily: string
  savingsAbsolute: string
  savingsDaily: string
}

const approvalStore = useApprovalStore()
const activeAction = ref<string | null>(null)
const rowErrors = reactive<Record<string, string>>({})
const limitForms = reactive<Record<string, LimitFormState>>({})

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

async function loadApprovals() {
  await approvalStore.load()
  approvalStore.approvals.forEach((approval) => ensureForm(approval.id))
}

async function handleApprove(userId: string) {
  const payload = buildPayload(userId)

  if (!payload) {
    return
  }

  activeAction.value = `${userId}:approve`

  try {
    await approvalStore.approve(userId, payload)
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
  } catch (caughtError) {
    rowErrors[userId] = toErrorMessage(caughtError)
  } finally {
    activeAction.value = null
  }
}

onMounted(loadApprovals)
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Pending approvals"
      description="Employee-overzicht voor nieuwe klanten. Bij approval stel je direct de checking- en savingslimieten in."
    >
      <template #actions>
        <AppButton variant="secondary" @click="loadApprovals">Verversen</AppButton>
      </template>
    </PageHeader>

    <LoadingState
      v-if="approvalStore.isLoading && approvalStore.approvals.length === 0"
      label="Pending klanten laden..."
    />

    <EmptyState
      v-else-if="approvalStore.approvals.length === 0"
      title="Geen pending registraties"
      description="Nieuwe klanten verschijnen hier zodra ze zich registreren."
    />

    <template v-else>
      <AppCard
        v-for="approval in approvalStore.approvals"
        :key="approval.id"
        :title="`${approval.firstName} ${approval.lastName}`"
        :subtitle="approval.reason"
      >
        <div class="grid-two">
          <div class="stack-sm">
            <div class="row-between">
              <span>E-mail</span>
              <strong>{{ approval.email }}</strong>
            </div>
            <div class="row-between">
              <span>BSN</span>
              <strong>{{ approval.bsn }}</strong>
            </div>
            <div class="row-between">
              <span>Telefoon</span>
              <strong>{{ approval.phoneNumber }}</strong>
            </div>
            <div class="row-between">
              <span>Registratiedatum</span>
              <strong>{{ approval.createdAt ? formatDateTime(approval.createdAt) : 'Onbekend' }}</strong>
            </div>
          </div>

          <div class="stack-sm">
            <div class="inline-form-row">
              <AppInput
                v-model="ensureForm(approval.id).checkingAbsolute"
                label="Checking absolute limit"
                placeholder="-500"
              />
              <AppInput
                v-model="ensureForm(approval.id).checkingDaily"
                label="Checking daily limit"
                placeholder="1000"
              />
            </div>
            <div class="inline-form-row">
              <AppInput
                v-model="ensureForm(approval.id).savingsAbsolute"
                label="Savings absolute limit"
                placeholder="0"
              />
              <AppInput
                v-model="ensureForm(approval.id).savingsDaily"
                label="Savings daily limit"
                placeholder="5000"
              />
            </div>
            <span v-if="rowErrors[approval.id]" class="input-error">{{ rowErrors[approval.id] }}</span>
          </div>
        </div>

        <template #actions>
          <div class="button-group">
            <AppButton
              :disabled="activeAction === `${approval.id}:approve` || activeAction === `${approval.id}:reject`"
              @click="handleApprove(approval.id)"
            >
              {{ activeAction === `${approval.id}:approve` ? 'Goedkeuren...' : 'Goedkeuren' }}
            </AppButton>
            <AppButton
              variant="danger"
              :disabled="activeAction === `${approval.id}:approve` || activeAction === `${approval.id}:reject`"
              @click="handleReject(approval.id)"
            >
              {{ activeAction === `${approval.id}:reject` ? 'Afwijzen...' : 'Afwijzen' }}
            </AppButton>
          </div>
        </template>
      </AppCard>
    </template>
  </div>
</template>
