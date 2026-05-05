import type { CreateTransactionPayload, Transaction } from '@/types/transaction'
import type { TransactionService } from '@/services/contracts'

import { mockDb } from './db'
import { simulateDelay } from './shared'

function getAccountOwnerByIban(iban: string) {
  return mockDb.accounts.find((account) => account.iban === iban)?.userId
}

function getAccountTypeByIban(iban: string) {
  const account = mockDb.accounts.find((entry) => entry.iban === iban)
  if (!account) {
    return undefined
  }

  if (account.type === 'checking') {
    return 'CHECKING'
  }

  if (account.type === 'savings') {
    return 'SAVINGS'
  }

  return undefined
}

function accountBelongsToUser(iban: string, userId: string) {
  return mockDb.accounts.some((account) => account.iban === iban && account.userId === userId)
}

function transactionBelongsToUser(transaction: Transaction, userId: string) {
  if (String(transaction.initiator.userId) === userId) {
    return true
  }

  return [transaction.fromAccount.iban, transaction.toAccount.iban].some((iban) =>
    accountBelongsToUser(iban, userId),
  )
}

export function createMockTransactionService(): TransactionService {
  return {
    async getTransactionsByUser(userId: string) {
      await simulateDelay()

      return mockDb.transactions
        .filter((transaction) => transactionBelongsToUser(transaction, userId))
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    },
    async getTransactionsByAccount(iban: string) {
      await simulateDelay()

      return mockDb.transactions
        .filter(
          (transaction) =>
            transaction.fromAccount.iban === iban || transaction.toAccount.iban === iban,
        )
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    },
    async createTransaction(payload: CreateTransactionPayload) {
      await simulateDelay()

      const fromAccountType = getAccountTypeByIban(payload.fromAccountIban)
      const toAccountType = getAccountTypeByIban(payload.toAccountIban)
      const initiatorId = Number(getAccountOwnerByIban(payload.fromAccountIban)) || 0

      const transaction: Transaction = {
        transactionId: mockDb.transactions.length + 1,
        transactionType: 'TRANSFER',
        status: 'COMPLETED',
        amount: payload.amount,
        currency: 'EUR',
        description: payload.description,
        createdAt: new Date().toISOString(),
        fromAccount: {
          iban: payload.fromAccountIban,
          accountType: fromAccountType,
        },
        toAccount: {
          iban: payload.toAccountIban,
          accountType: toAccountType,
        },
        initiator: {
          userId: initiatorId,
          role: 'CUSTOMER',
        },
      }

      mockDb.transactions.unshift(transaction)
      return transaction
    },
  }
}
