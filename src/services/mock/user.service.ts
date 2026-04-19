import type { UserManagementService } from '@/services/contracts'

import { mockDb } from './db'
import { simulateDelay } from './shared'

export function createMockUserManagementService(): UserManagementService {
  return {
    async getUserById(userId) {
      await simulateDelay(150)

      const user = mockDb.users.find((entry) => entry.id === userId)

      if (!user) {
        throw new Error('User not found in mock dataset.')
      }

      const { password: _password, ...safeUser } = user
      return safeUser
    },
    async softDeleteUser(userId) {
      await simulateDelay(150)

      const user = mockDb.users.find((entry) => entry.id === userId)

      if (!user) {
        throw new Error('User not found in mock dataset.')
      }

      user.deletedAt = new Date().toISOString()
      mockDb.approvals = mockDb.approvals.filter((approval) => approval.id !== userId)
    },
  }
}
