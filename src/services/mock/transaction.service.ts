import type { CreateTransactionPayload, Transaction } from '@/types/transaction'
import type { TransactionService } from '@/services/contracts'

import { mockDb } from './db'
import { simulateDelay } from './shared'

function getAccountOwnerByIban(iban: string) {
  return mockDb.accounts.find((account) => account.iban === iban)?.userId
}

function accountBelongsToUser(iban: string, userId: string) {
  return mockDb.accounts.some((account) => account.iban === iban && account.userId === userId)
}

function transactionBelongsToUser(transaction: Transaction, userId: string) {
  if (String(transaction.initiatedBy.userId) === userId) {
    return true
  }

  return [transaction.fromAccount, transaction.toAccount].some((iban) =>
    accountBelongsToUser(iban, userId),
  )
}

function getUserById(userId: string | number | undefined) {
  if (!userId) return null
  const user = mockDb.users.find((u) => u.id === String(userId))
  if (!user) return null
  return {
    userId: parseInt(String(userId)) || 1,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  }
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
            transaction.fromAccount === iban || transaction.toAccount === iban,
        )
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    },
    async createTransaction(payload: CreateTransactionPayload) {
      await simulateDelay()

      const initiatorUserId = getAccountOwnerByIban(payload.fromAccountIban)
      const initiatedByUser = getUserById(initiatorUserId)

      const transaction: Transaction = {
        transactionId: mockDb.transactions.length + 1,
        type: 'TRANSFER',
        amount: payload.amount,
        description: payload.description,
        createdAt: new Date().toISOString(),
        fromAccount: payload.fromAccountIban,
        toAccount: payload.toAccountIban,
        initiatedBy: initiatedByUser || {
          userId: 1,
          firstName: 'Unknown',
          lastName: 'User',
          email: 'unknown@bank.dev',
        },
      }

      mockDb.transactions.unshift(transaction)
      return transaction
    },
  }
}
