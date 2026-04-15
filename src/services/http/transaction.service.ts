import type { HttpClient } from '@/services/api/httpClient'
import type { TransactionService } from '@/services/contracts'

export function createHttpTransactionService(client: HttpClient): TransactionService {
  return {
    getTransactionsByUser: (userId) => client.get(`/users/${userId}/transactions`),
  }
}
