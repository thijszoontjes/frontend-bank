import { ref } from 'vue'
import { defineStore } from 'pinia'

import { services } from '@/services'
import type { AtmTransactionResult } from '@/types/atm'
import { toErrorMessage } from '@/utils/format'

export const useAtmStore = defineStore('atm', () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastResult = ref<AtmTransactionResult | null>(null)

  async function deposit(iban: string, amount: number) {
    isLoading.value = true
    error.value = null
    lastResult.value = null

    try {
      const result = await services.atm.deposit({ iban, amount })
      lastResult.value = result
      return result
    } catch (caughtError) {
      error.value = toErrorMessage(caughtError)
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function withdraw(iban: string, amount: number) {
    isLoading.value = true
    error.value = null
    lastResult.value = null

    try {
      const result = await services.atm.withdraw({ iban, amount })
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
