import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { services } from '@/services'
import type { ApprovalItem, ApprovalPayload } from '@/types/approval'
import type { PageMetadata } from '@/types/common'
import { toErrorMessage } from '@/utils/format'

export const useApprovalStore = defineStore('approval', () => {
  const approvals = ref<ApprovalItem[]>([])
  const pagination = ref<PageMetadata | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const pendingCount = computed(() => pagination.value?.totalElements ?? approvals.value.length)
  const hasPreviousPage = computed(() => (pagination.value?.page ?? 0) > 0)
  const hasNextPage = computed(() =>
    pagination.value ? pagination.value.page + 1 < pagination.value.totalPages : false,
  )

  async function load(page = 0, size = 20) {
    isLoading.value = true
    error.value = null

    try {
      const result = await services.approval.getPendingApprovals(page, size)
      approvals.value = result.items
      pagination.value = result.page
    } catch (caughtError) {
      error.value = toErrorMessage(caughtError)
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function approve(userId: string, payload: ApprovalPayload) {
    await services.approval.approveApproval(userId, payload)
    approvals.value = approvals.value.filter((approval) => approval.id !== userId)
  }

  async function reject(userId: string) {
    await services.approval.rejectApproval(userId)
    approvals.value = approvals.value.filter((approval) => approval.id !== userId)
  }

  function clear() {
    approvals.value = []
    pagination.value = null
    error.value = null
  }

  return {
    approvals,
    pagination,
    pendingCount,
    hasPreviousPage,
    hasNextPage,
    isLoading,
    error,
    load,
    approve,
    reject,
    clear,
  }
})
