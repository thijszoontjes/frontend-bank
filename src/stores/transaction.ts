import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { services } from '@/services'
import type { Transaction } from '@/types/transaction'
import { toErrorMessage } from '@/utils/format'

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const recentTransactions = computed(() => transactions.value.slice(0, 5))

  async function load(userId: string) {
    isLoading.value = true
    error.value = null

    try {
      transactions.value = await services.transaction.getTransactionsByUser(userId)
    } catch (caughtError) {
      error.value = toErrorMessage(caughtError)
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  function add(transaction: Transaction) {
    transactions.value.unshift(transaction)
  }

  function clear() {
    transactions.value = []
    error.value = null
  }

  return {
    transactions,
    recentTransactions,
    isLoading,
    error,
    load,
    add,
    clear,
  }
})
