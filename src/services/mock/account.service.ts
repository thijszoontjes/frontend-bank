import type { AccountService } from '@/services/contracts'
import type { AccountSummary } from '@/types/account'

import { mockDb } from './db'
import { simulateDelay } from './shared'

function buildSummary(userId: string): AccountSummary {
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
    async getAccountsByUser(userId: string) {
      await simulateDelay()
      return mockDb.accounts.filter((account) => account.userId === userId)
    },
    async getAccountSummary(userId: string) {
      await simulateDelay(180)
      return buildSummary(userId)
    },
  }
}
