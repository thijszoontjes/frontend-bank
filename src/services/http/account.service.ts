import type { HttpClient } from '@/services/api/httpClient'
import type { AccountService } from '@/services/contracts'
import { mapAccountPortfolio } from '@/services/http/account.mapper'
import type { BackendAccountPortfolioResponse } from '@/services/http/account.mapper'

export function createHttpAccountService(client: HttpClient): AccountService {
  return {
    async getAccountPortfolio(userId) {
      const response = await client.get<BackendAccountPortfolioResponse>(`/users/${userId}/accounts`)
      return mapAccountPortfolio(response)
    },
  }
}
