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
  { key: 'transactionType', label: 'Type' },
  { key: 'createdAt', label: 'Date' },
  { key: 'amount', label: 'Amount' },
  { key: 'fromAccount', label: 'From' },
  { key: 'toAccount', label: 'To' },
  { key: 'status', label: 'Status' },
  { key: 'description', label: 'Description' },
]

function statusVariant(status: string) {
  return status === 'COMPLETED' ? 'success' : 'danger'
}
</script>

<template>
  <div>
    <!-- Cast to Record<string, any>[] for the generic table component -->
    <AppTable :columns="columns" :rows="(props.transactions as any[])">
      
      <template #cell-transactionType="{ value }">
        {{ value }}
      </template>

      <template #cell-createdAt="{ value }">
        {{ formatDateTime(String(value)) }}
      </template>

      <template #cell-amount="{ row }">
        <span :class="row.status === 'COMPLETED' ? 'amount-positive' : 'amount-negative'">
          <!-- FIX: Added a fallback for currency to prevent RangeError -->
          {{ row.currency 
             ? formatCurrency(Number(row.amount), String(row.currency)) 
             : row.amount 
          }}
        </span>
      </template>

      <template #cell-fromAccount="{ row }">
        <!-- FIX: Optional chaining to prevent "cannot read property iban of undefined" -->
        {{ row.fromAccount || '—' }}
      </template>

      <template #cell-toAccount="{ row }">
        <!-- FIX: Optional chaining -->
        {{ row.toAccount || '—' }}
      </template>

      <template #cell-status="{ value }">
        <AppBadge :variant="statusVariant(String(value))">{{ value }}</AppBadge>
      </template>

      <template #cell-description="{ value }">
        <span>{{ value || '—' }}</span>
      </template>

    </AppTable>
  </div>
</template>