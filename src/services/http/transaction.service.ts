import type { HttpClient } from '@/services/api/httpClient'
import type { TransactionService } from '@/services/contracts'
import type { Transaction } from '@/types/transaction'

export function createHttpTransactionService(client: HttpClient): TransactionService {
  return {
    getTransactionsByUser: (userId) => client.get<Transaction[]>(`/users/${userId}/transactions`),
    getTransactionsByAccount: (iban) => client.get<Transaction[]>(`/accounts/${iban}/transactions`),
    createTransaction: (payload) => client.post<Transaction>('/transactions', payload),
  }
}
