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
    async listTransactions(page = 0, size = 25, sortBy = 'transactionId', sortDir = 'DESC', filters = {}) {
      await simulateDelay()

      let filtered = [...mockDb.transactions]

      // Apply search filter
      if (filters.search) {
        const search = filters.search.toLowerCase()
        filtered = filtered.filter((t) =>
          t.transactionId.toString().includes(search) ||
          t.fromAccount.toLowerCase().includes(search) ||
          t.toAccount.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search) ||
          t.initiatedBy.firstName.toLowerCase().includes(search) ||
          t.initiatedBy.lastName.toLowerCase().includes(search)
        )
      }

      // Apply date filters
      if (filters.startDate) {
        const startDate = new Date(filters.startDate)
        filtered = filtered.filter((t) => new Date(t.createdAt) >= startDate)
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        endDate.setHours(23, 59, 59, 999)
        filtered = filtered.filter((t) => new Date(t.createdAt) <= endDate)
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aVal: any = a.transactionId
        let bVal: any = b.transactionId

        if (sortBy === 'amount') {
          aVal = a.amount
          bVal = b.amount
        } else if (sortBy === 'createdAt') {
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
        }

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return sortDir === 'ASC' ? comparison : -comparison
      })

      // Apply pagination
      const totalElements = filtered.length
      const totalPages = Math.ceil(totalElements / size)
      const start = page * size
      const end = start + size
      const items = filtered.slice(start, end)

      return {
        items,
        page: {
          page,
          size,
          totalElements,
          totalPages,
        },
      }
    },
    async listTransactionsByAccount(iban: string, page = 0, size = 25, filters = {}) {
      await simulateDelay()

      let filtered = mockDb.transactions.filter(
        (t) => t.fromAccount === iban || t.toAccount === iban,
      )

      if (filters.search) {
        const search = filters.search.toLowerCase()
        filtered = filtered.filter(
          (t) =>
            t.fromAccount.toLowerCase().includes(search) ||
            t.toAccount.toLowerCase().includes(search),
        )
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate)
        filtered = filtered.filter((t) => new Date(t.createdAt) >= startDate)
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        endDate.setHours(23, 59, 59, 999)
        filtered = filtered.filter((t) => new Date(t.createdAt) <= endDate)
      }

      if (filters.amountOperator && filters.amountValue !== undefined) {
        const val = Number(filters.amountValue)
        filtered = filtered.filter((t) => {
          if (filters.amountOperator === 'gt') return t.amount > val
          if (filters.amountOperator === 'eq') return t.amount === val
          if (filters.amountOperator === 'lt') return t.amount < val
          return true
        })
      }

      filtered.sort((a, b) => b.transactionId - a.transactionId)

      const totalElements = filtered.length
      const totalPages = Math.ceil(totalElements / size) || 1
      const start = page * size
      const items = filtered.slice(start, start + size)

      return {
        items,
        page: { page, size, totalElements, totalPages },
      }
    },
    async listTransactionsByUser(userId: string, page = 0, size = 25, filters = {}) {
      await simulateDelay()

      let filtered = mockDb.transactions.filter((t) => transactionBelongsToUser(t, userId))

      if (filters.search) {
        const search = filters.search.toLowerCase()
        filtered = filtered.filter(
          (t) =>
            t.fromAccount.toLowerCase().includes(search) ||
            t.toAccount.toLowerCase().includes(search),
        )
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate)
        filtered = filtered.filter((t) => new Date(t.createdAt) >= startDate)
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        endDate.setHours(23, 59, 59, 999)
        filtered = filtered.filter((t) => new Date(t.createdAt) <= endDate)
      }

      if (filters.amountOperator && filters.amountValue !== undefined) {
        const val = Number(filters.amountValue)
        filtered = filtered.filter((t) => {
          if (filters.amountOperator === 'gt') return t.amount > val
          if (filters.amountOperator === 'eq') return t.amount === val
          if (filters.amountOperator === 'lt') return t.amount < val
          return true
        })
      }

      filtered.sort((a, b) => b.transactionId - a.transactionId)

      const totalElements = filtered.length
      const totalPages = Math.ceil(totalElements / size) || 1
      const start = page * size
      const items = filtered.slice(start, start + size)

      return {
        items,
        page: { page, size, totalElements, totalPages },
      }
    },
    async getTransactionsByUser(userId: string) {
      await simulateDelay()

      return mockDb.transactions
        .filter((transaction) => transactionBelongsToUser(transaction, userId))
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
