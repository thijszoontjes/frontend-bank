import type { HttpClient } from '@/services/api/httpClient'
import type { TransactionService } from '@/services/contracts'
import type { Transaction, TransactionListFilters } from '@/types/transaction'

interface PagedTransactionsResponse {
  items: Transaction[]
  page: {
    page: number
    size: number
    totalElements: number
    totalPages: number
  }
}

function buildTransactionQuery(page: number, size: number, sortBy: string, sortDir: string, filters: TransactionListFilters = {}) {
  const params = new URLSearchParams({
    pageNr: String(page),
    pageSize: String(size),
    sortBy,
    sortDir,
  })

  if (filters.search) {
    params.set('search', filters.search)
  }

  if (filters.startDate) {
    params.set('startDate', filters.startDate)
  }

  if (filters.endDate) {
    params.set('endDate', filters.endDate)
  }

  if (filters.amountOperator && filters.amountValue !== undefined) {
    params.set('amountOperator', filters.amountOperator)
    params.set('amountValue', String(filters.amountValue))
  }

  return params.toString()
}

export function createHttpTransactionService(client: HttpClient): TransactionService {
  return {
    async listTransactions(page = 0, size = 25, sortBy = 'transactionId', sortDir = 'DESC', filters = {}) {
      const response = await client.get<PagedTransactionsResponse>(`/transactions?${buildTransactionQuery(page, size, sortBy, sortDir, filters)}`)

      return {
        items: response.items,
        page: {
          page: response.page.page,
          size: response.page.size,
          totalElements: response.page.totalElements,
          totalPages: response.page.totalPages,
        },
      }
    },
    async listTransactionsByAccount(iban, page = 0, size = 25, filters = {}) {
      const params = new URLSearchParams({
        pageNr: String(page + 1), // This endpoint uses 1-based pageNr (defaultValue="1", does pageNr-1 internally)
        pageSize: String(size),
        sortBy: 'transactionId',
        sortDir: 'DESC',
      })

      if (filters.search) params.set('search', filters.search)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)
      if (filters.amountOperator && filters.amountValue !== undefined) {
        params.set('amountOperator', filters.amountOperator)
        params.set('amountValue', String(filters.amountValue))
      }

      const response = await client.get<PagedTransactionsResponse>(`/accounts/${iban}/transactions?${params.toString()}`)

      return {
        items: response.items,
        page: {
          page: response.page.page,
          size: response.page.size,
          totalElements: response.page.totalElements,
          totalPages: response.page.totalPages,
        },
      }
    },
    async listTransactionsByUser(userId, page = 0, size = 25, filters = {}) {
      const params = new URLSearchParams({
        pageNr: String(page + 1), // This endpoint uses 1-based pageNr (defaultValue="1", does pageNr-1 internally)
        pageSize: String(size),
        sortBy: 'transactionId',
        sortDir: 'DESC',
      })

      if (filters.search) params.set('search', filters.search)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)
      if (filters.amountOperator && filters.amountValue !== undefined) {
        params.set('amountOperator', filters.amountOperator)
        params.set('amountValue', String(filters.amountValue))
      }

      const response = await client.get<PagedTransactionsResponse>(`/users/${userId}/transactions?${params.toString()}`)

      return {
        items: response.items,
        page: {
          page: response.page.page,
          size: response.page.size,
          totalElements: response.page.totalElements,
          totalPages: response.page.totalPages,
        },
      }
    },
    async getTransactionsByUser(userId) {
      const response = await client.get<PagedTransactionsResponse>(`/users/${userId}/transactions`)
      return response.items
    },
    createTransaction: (payload) => client.post<Transaction>('/transactions', payload),
  }
}
