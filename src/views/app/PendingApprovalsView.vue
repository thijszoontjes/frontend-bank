<script setup lang="ts">
import { onMounted, ref } from 'vue'

import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTable from '@/components/ui/AppTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useCurrency } from '@/composables/useCurrency'
import { useApprovalStore } from '@/stores/approval'
import { formatDateTime } from '@/utils/format'

const { formatCurrency } = useCurrency()
const approvalStore = useApprovalStore()
const activeId = ref<string | null>(null)

const columns = [
  { key: 'requester', label: 'Requester' },
  { key: 'type', label: 'Type' },
  { key: 'priority', label: 'Priority' },
  { key: 'amount', label: 'Amount' },
  { key: 'requestedAt', label: 'Requested' },
  { key: 'actions', label: 'Actions' },
]

function priorityVariant(priority: string) {
  if (priority === 'high') {
    return 'danger'
  }

  if (priority === 'medium') {
    return 'warning'
  }

  return 'info'
}

async function loadApprovals() {
  await approvalStore.load()
}

async function handleApprove(id: string) {
  activeId.value = id
  try {
    await approvalStore.approve(id)
  } finally {
    activeId.value = null
  }
}

async function handleReject(id: string) {
  activeId.value = id
  try {
    await approvalStore.reject(id)
  } finally {
    activeId.value = null
  }
}

onMounted(loadApprovals)
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Pending approvals"
      description="This page demonstrates an employee-only route backed by a dedicated approval store and service."
    />

    <LoadingState
      v-if="approvalStore.isLoading && approvalStore.approvals.length === 0"
      label="Collecting pending approvals..."
    />

    <EmptyState
      v-else-if="approvalStore.approvals.length === 0"
      title="No pending approvals"
      description="Approvals disappear immediately after mock approval or rejection actions."
    />

    <AppTable v-else :columns="columns" :rows="approvalStore.approvals as unknown as Record<string, unknown>[]">
      <template #cell-requester="{ row }">
        <div class="table-meta">
          <strong>{{ row.requester }}</strong>
          <span>{{ row.reason }}</span>
        </div>
      </template>
      <template #cell-priority="{ value }">
        <AppBadge :variant="priorityVariant(String(value))">{{ value }}</AppBadge>
      </template>
      <template #cell-amount="{ row }">
        <strong>{{ formatCurrency(Number(row.amount), String(row.currency)) }}</strong>
      </template>
      <template #cell-requestedAt="{ value }">
        {{ formatDateTime(String(value)) }}
      </template>
      <template #cell-actions="{ row }">
        <div class="button-group">
          <AppButton
            size="sm"
            :disabled="activeId === row.id"
            @click="handleApprove(String(row.id))"
          >
            Approve
          </AppButton>
          <AppButton
            variant="danger"
            size="sm"
            :disabled="activeId === row.id"
            @click="handleReject(String(row.id))"
          >
            Reject
          </AppButton>
        </div>
      </template>
    </AppTable>
  </div>
</template>
