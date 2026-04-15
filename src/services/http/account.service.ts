import type { HttpClient } from '@/services/api/httpClient'
import type { AccountService } from '@/services/contracts'

export function createHttpAccountService(client: HttpClient): AccountService {
  return {
    getAccountsByUser: (userId) => client.get(`/users/${userId}/accounts`),
    getAccountSummary: (userId) => client.get(`/users/${userId}/accounts/summary`),
  }
}
