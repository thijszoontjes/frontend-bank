import type { ApprovalService } from '@/services/contracts'
import type { ApprovalItem } from '@/types/approval'

import { mockDb } from './db'
import { simulateDelay } from './shared'

function findPendingCustomer(id: string) {
  const user = mockDb.users.find(
    (entry) => entry.id === id && entry.role === 'customer' && entry.approvalStatus === 'pending',
  )

  if (!user) {
    throw new Error('Approval not found in mock dataset.')
  }

  return user
}

function mapApprovalItem(user: (typeof mockDb.users)[number]): ApprovalItem {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    bsn: user.bsn,
    createdAt: user.createdAt,
  }
}

function createApprovedAccount(
  userId: string,
  type: 'checking' | 'savings',
  ibanPrefix: string,
  absoluteLimit: number,
  dailyLimit: number,
) {
  const timestamp = new Date().toISOString()

  return {
    id: `acc-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    name: type === 'checking' ? 'Checking account' : 'Savings account',
    iban: `NL${ibanPrefix}BANK${Math.random().toString().slice(2, 12)}`,
    type,
    currency: 'EUR',
    availableBalance: 0,
    status: 'active' as const,
    createdAt: timestamp,
    updatedAt: timestamp,
    absoluteLimit,
    dailyLimit,
  }
}

export function createMockApprovalService(): ApprovalService {
  return {
    async getPendingApprovals(page = 0, size = 20) {
      await simulateDelay()
      const start = page * size
      const pendingUsers = mockDb.users.filter(
        (entry) => entry.role === 'customer' && entry.approvalStatus === 'pending' && !entry.deletedAt,
      )

      return {
        items: pendingUsers.slice(start, start + size).map(mapApprovalItem),
        page: {
          page,
          size,
          totalElements: pendingUsers.length,
          totalPages: Math.max(1, Math.ceil(pendingUsers.length / size)),
        },
      }
    },
    async approveApproval(id: string, payload) {
      await simulateDelay(200)
      findPendingCustomer(id)
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

    },
    async rejectApproval(id: string) {
      await simulateDelay(200)
      findPendingCustomer(id)
      const user = mockDb.users.find((entry) => entry.id === id)
      if (user) {
        user.approved = false
        user.approvalStatus = 'rejected'
      }
    },
  }
}
