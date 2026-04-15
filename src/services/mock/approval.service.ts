import type { ApprovalService } from '@/services/contracts'

import { mockDb } from './db'
import { simulateDelay } from './shared'

function findApproval(id: string) {
  const approval = mockDb.approvals.find((entry) => entry.id === id)

  if (!approval) {
    throw new Error('Approval not found in mock dataset.')
  }

  return approval
}

export function createMockApprovalService(): ApprovalService {
  return {
    async getPendingApprovals() {
      await simulateDelay()
      return mockDb.approvals.filter((approval) => approval.status === 'pending')
    },
    async approveApproval(id: string) {
      await simulateDelay(200)
      const approval = findApproval(id)
      approval.status = 'approved'
      return approval
    },
    async rejectApproval(id: string) {
      await simulateDelay(200)
      const approval = findApproval(id)
      approval.status = 'rejected'
      return approval
    },
  }
}
