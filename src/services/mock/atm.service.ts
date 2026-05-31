import type { AtmService } from '@/services/contracts'
import type { AtmTransactionResult } from '@/types/atm'

import { mockDb } from './db'
import { simulateDelay } from './shared'

export function createMockAtmService(): AtmService {
  return {
    async deposit({ toAccountIban, amount }) {
      await simulateDelay(300)

      const account = mockDb.accounts.find((a) => a.iban === toAccountIban)
      if (!account) {
        throw new Error('Account not found.')
      }

      account.availableBalance += amount
      account.ledgerBalance += amount

      const result: AtmTransactionResult = {
        transactionId: Date.now(),
        iban: toAccountIban,
        amount,
        newBalance: account.availableBalance,
        type: 'DEPOSIT',
        createdAt: new Date().toISOString(),
      }

      return result
    },

    async withdraw({ fromAccountIban, amount }) {
      await simulateDelay(300)

      const account = mockDb.accounts.find((a) => a.iban === fromAccountIban)
      if (!account) {
        throw new Error('Account not found.')
      }

      const absoluteLimit = account.absoluteLimit ?? 0
      if (account.availableBalance - amount < absoluteLimit) {
        throw new Error('Insufficient balance. Absolute limit would be exceeded.')
      }

      account.availableBalance -= amount
      account.ledgerBalance -= amount

      const result: AtmTransactionResult = {
        transactionId: Date.now(),
        iban: fromAccountIban,
        amount,
        newBalance: account.availableBalance,
        type: 'WITHDRAWAL',
        createdAt: new Date().toISOString(),
      }

      return result
    },
  }
}
