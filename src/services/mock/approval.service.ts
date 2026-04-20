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

function createApprovedAccount(
  userId: string,
  type: 'checking' | 'savings',
  ibanPrefix: string,
  absoluteLimit: number,
  dailyLimit: number,
) {
  return {
    id: `acc-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    name: type === 'checking' ? 'Checking account' : 'Savings account',
    iban: `NL${ibanPrefix}BANK${Math.random().toString().slice(2, 12)}`,
    type,
    currency: 'EUR',
    availableBalance: 0,
    ledgerBalance: 0,
    status: 'active' as const,
    updatedAt: new Date().toISOString(),
    absoluteLimit,
    dailyLimit,
  }
}

export function createMockApprovalService(): ApprovalService {
  return {
    async getPendingApprovals(page = 0, size = 20) {
      await simulateDelay()
      const start = page * size
      const items = mockDb.approvals.slice(start, start + size)

      return {
        items,
        page: {
          page,
          size,
          totalElements: mockDb.approvals.length,
          totalPages: Math.max(1, Math.ceil(mockDb.approvals.length / size)),
        },
      }
    },
    async approveApproval(id: string, payload) {
      await simulateDelay(200)
      findApproval(id)
      const user = mockDb.users.find((entry) => entry.id === id)

      if (user) {
        user.approved = true
        user.approvalStatus = 'approved'
        mockDb.accounts.unshift(
          createApprovedAccount(
            id,
            'checking',
            '20',
            payload.checkingAccount.absoluteLimit,
            payload.checkingAccount.dailyLimit,
          ),
          createApprovedAccount(
            id,
            'savings',
            '91',
            payload.savingsAccount.absoluteLimit,
            payload.savingsAccount.dailyLimit,
          ),
        )
      }

      mockDb.approvals = mockDb.approvals.filter((approval) => approval.id !== id)
    },
    async rejectApproval(id: string) {
      await simulateDelay(200)
      findApproval(id)
      const user = mockDb.users.find((entry) => entry.id === id)
      if (user) {
        user.approved = false
        user.approvalStatus = 'rejected'
      }
      mockDb.approvals = mockDb.approvals.filter((approval) => approval.id !== id)
    },
  }
}
