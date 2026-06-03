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
    pageNr: String(page + 1), // Backend expects 1-based page numbers
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

  return params.toString()
}

export function createHttpTransactionService(client: HttpClient): TransactionService {
  return {
    async listTransactions(page = 0, size = 25, sortBy = 'transactionId', sortDir = 'DESC', filters = {}) {
      const response = await client.get<PagedTransactionsResponse>(`/transactions?${buildTransactionQuery(page, size, sortBy, sortDir, filters)}`)

      return {
        items: response.items,
        page: {
          page: response.page.page - 1, // Convert back to 0-based for frontend
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
    async getTransactionsByAccount(iban) {
      const response = await client.get<PagedTransactionsResponse>(`/accounts/${iban}/transactions`)
      return response.items
    },
    createTransaction: (payload) => client.post<Transaction>('/transactions', payload),
  }
}
