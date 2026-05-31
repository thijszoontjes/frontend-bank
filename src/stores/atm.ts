import { ref } from 'vue'
import { defineStore } from 'pinia'

import { services } from '@/services'
import type { AtmTransactionResult, AtmDepositPayload, AtmWithdrawPayload } from '@/types/atm'
import { toErrorMessage } from '@/utils/format'

export const useAtmStore = defineStore('atm', () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastResult = ref<AtmTransactionResult | null>(null)

  async function deposit(payload: AtmDepositPayload) {
    isLoading.value = true
    error.value = null
    lastResult.value = null

    try {
      const result = await services.atm.deposit(payload)
      lastResult.value = result
      return result
    } catch (caughtError) {
      error.value = toErrorMessage(caughtError)
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function withdraw(payload: AtmWithdrawPayload) {
    isLoading.value = true
    error.value = null
    lastResult.value = null

    try {
      const result = await services.atm.withdraw(payload)
      lastResult.value = result
      return result
    } catch (caughtError) {
      error.value = toErrorMessage(caughtError)
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  function clearResult() {
    lastResult.value = null
    error.value = null
  }

  return {
    isLoading,
    error,
    lastResult,
    deposit,
    withdraw,
    clearResult,
  }
})
