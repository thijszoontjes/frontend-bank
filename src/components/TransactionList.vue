<script setup lang="ts">
import AppBadge from '@/components/ui/AppBadge.vue'
import AppTable from '@/components/ui/AppTable.vue'
import { useCurrency } from '@/composables/useCurrency'
import { formatDateTime } from '@/utils/format'
import type { Transaction } from '@/types/transaction'

const props = defineProps({
  transactions: {
    type: Array as () => Transaction[],
    required: true,
  },
})

const { formatCurrency } = useCurrency()

const columns = [
  { key: 'type', label: 'Type' },
  { key: 'createdAt', label: 'Date' },
  { key: 'amount', label: 'Amount' },
  { key: 'fromAccount', label: 'From' },
  { key: 'toAccount', label: 'To' },
  { key: 'status', label: 'Status' },
  { key: 'description', label: 'Description' },
]

function statusVariant(status: string | undefined) {
  return status === 'COMPLETED' ? 'success' : 'danger'
}
</script>

<template>
  <div>
    <!-- Cast to Record<string, any>[] for the generic table component -->
    <AppTable :columns="columns" :rows="(props.transactions as any[])">
      
      <template #cell-type="{ value }">
        {{ value }}
      </template>

      <template #cell-createdAt="{ value }">
        {{ formatDateTime(String(value)) }}
      </template>

      <template #cell-amount="{ row }">
        <span :class="row.status === 'COMPLETED' || !row.status ? 'amount-positive' : 'amount-negative'">
          {{ formatCurrency(Number(row.amount)) }}
        </span>
      </template>

      <template #cell-fromAccount="{ row }">
        {{ row.fromAccount || '—' }}
      </template>

      <template #cell-toAccount="{ row }">
        {{ row.toAccount || '—' }}
      </template>

      <template #cell-status="{ row }">
        <AppBadge v-if="row.status" :variant="statusVariant(String(row.status))">{{ row.status }}</AppBadge>
        <span v-else>—</span>
      </template>

      <template #cell-description="{ value }">
        <span>{{ value || '—' }}</span>
      </template>

    </AppTable>
  </div>
</template>