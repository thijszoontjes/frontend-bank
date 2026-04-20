import { ref } from 'vue'
import { defineStore } from 'pinia'

import { services } from '@/services'
import type { AccountSummary, BankAccount } from '@/types/account'
import { toErrorMessage } from '@/utils/format'

export const useAccountStore = defineStore('account', () => {
  const accounts = ref<BankAccount[]>([])
  const summary = ref<AccountSummary | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function load(userId: string) {
    isLoading.value = true
    error.value = null

    try {
      const portfolio = await services.account.getAccountPortfolio(userId)
      accounts.value = portfolio.accounts
      summary.value = portfolio.summary
    } catch (caughtError) {
      error.value = toErrorMessage(caughtError)
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  function clear() {
    accounts.value = []
    summary.value = null
    error.value = null
  }

  return {
    accounts,
    summary,
    isLoading,
    error,
    load,
    clear,
  }
})
