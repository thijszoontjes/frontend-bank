import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { services } from '@/services'
import type { ApprovalItem } from '@/types/approval'
import { toErrorMessage } from '@/utils/format'

export const useApprovalStore = defineStore('approval', () => {
  const approvals = ref<ApprovalItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const pendingCount = computed(() => approvals.value.length)

  async function load() {
    isLoading.value = true
    error.value = null

    try {
      approvals.value = await services.approval.getPendingApprovals()
    } catch (caughtError) {
      error.value = toErrorMessage(caughtError)
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function approve(id: string) {
    await services.approval.approveApproval(id)
    approvals.value = approvals.value.filter((approval) => approval.id !== id)
  }

  async function reject(id: string) {
    await services.approval.rejectApproval(id)
    approvals.value = approvals.value.filter((approval) => approval.id !== id)
  }

  function clear() {
    approvals.value = []
    error.value = null
  }

  return {
    approvals,
    pendingCount,
    isLoading,
    error,
    load,
    approve,
    reject,
    clear,
  }
})
