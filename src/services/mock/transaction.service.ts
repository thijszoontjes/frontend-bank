import type { TransactionService } from '@/services/contracts'

import { mockDb } from './db'
import { simulateDelay } from './shared'

export function createMockTransactionService(): TransactionService {
  return {
    async getTransactionsByUser(userId: string) {
      await simulateDelay()

      return mockDb.transactions
        .filter((transaction) => transaction.userId === userId)
        .sort((left, right) => new Date(right.bookedAt).getTime() - new Date(left.bookedAt).getTime())
    },
  }
}
