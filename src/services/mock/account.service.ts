import type { AccountService } from '@/services/contracts'

import { mockDb } from './db'
import { simulateDelay } from './shared'

function buildSummary(userId: string) {
  const accounts = mockDb.accounts.filter((account) => account.userId === userId)
  const totalBalance = accounts.reduce((sum, account) => sum + account.ledgerBalance, 0)
  const liquidBalance = accounts.reduce((sum, account) => sum + account.availableBalance, 0)

  return {
    totalBalance,
    liquidBalance,
    accountsCount: accounts.length,
    mainCurrency: accounts[0]?.currency ?? 'EUR',
  }
}

export function createMockAccountService(): AccountService {
  return {
    async getAccountPortfolio(userId: string) {
      await simulateDelay(180)

      return {
        accounts: mockDb.accounts.filter((account) => account.userId === userId),
        summary: buildSummary(userId),
      }
    },
  }
}
