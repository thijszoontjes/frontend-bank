import type { HttpClient } from '@/services/api/httpClient'
import type { AccountService } from '@/services/contracts'
import { mapAccountPortfolio } from '@/services/http/account.mapper'
import type { BackendAccountPortfolioResponse } from '@/services/http/account.mapper'
import type { PageMetadata } from '@/types/common'
import type { AccountListFilters, AccountListResult, AccountLimitsPayload, BankAccount } from '@/types/account'

interface BackendAccountResponse {
  iban: string
  balance: number
  accountType: 'CHECKING' | 'SAVINGS'
  status: 'OPEN' | 'CLOSED'
  absoluteLimit: number
  dailyLimit: number
  createdAt: string
  userId: number
  ownerEmail?: string
  ownerName?: string
}

interface PagedAccountsResponse {
  items: BackendAccountResponse[]
  page: PageMetadata
}

function mapStatusToBackend(status: BankAccount['status']): 'OPEN' | 'CLOSED' | undefined {
  if (status === 'active') return 'OPEN'
  if (status === 'blocked') return 'CLOSED'
  return undefined
}

function mapAccount(a: BackendAccountResponse): BankAccount {
  return {
    id: a.iban,
    userId: String(a.userId),
    name: a.accountType === 'CHECKING' ? 'Checking account' : 'Savings account',
    iban: a.iban,
    type: a.accountType === 'CHECKING' ? 'checking' : 'savings',
    currency: 'EUR',
    availableBalance: a.balance,
    status: a.status === 'OPEN' ? 'active' : 'blocked',
    createdAt: a.createdAt,
    absoluteLimit: a.absoluteLimit,
    dailyLimit: a.dailyLimit,
    ownerEmail: a.ownerEmail,
    ownerName: a.ownerName,
  }
}

export function createHttpAccountService(client: HttpClient): AccountService {
  return {
    async getAccountPortfolio(userId) {
      const response = await client.get<BackendAccountPortfolioResponse>(`/users/${userId}/accounts`)
      return mapAccountPortfolio(response)
    },

    async listAllAccounts(page = 0, size = 25, filters: AccountListFilters = {}): Promise<AccountListResult> {
      const params = new URLSearchParams({
        page: String(page),
        size: String(size),
      })

      if (filters.type) {
        params.set('accountType', filters.type.toUpperCase())
      }

      if (filters.status) {
        const backendStatus = mapStatusToBackend(filters.status)
        if (backendStatus) {
          params.set('status', backendStatus)
        }
      }

      if (filters.balanceOperator !== undefined && filters.balanceValue !== undefined) {
        params.set('balanceOperator', filters.balanceOperator)
        params.set('balanceValue', String(filters.balanceValue))
      }

      if (filters.createdAfter) {
        params.set('createdAfter', filters.createdAfter)
      }

      const response = await client.get<PagedAccountsResponse>(`/accounts?${params.toString()}`)

      return {
        items: (response.items ?? []).map(mapAccount),
        page: response.page,
      }
    },

    async updateAccountLimits(iban: string, payload: AccountLimitsPayload): Promise<BankAccount> {
      const response = await client.put<BackendAccountResponse>(`/accounts/${iban}/limits`, payload)
      return mapAccount(response)
    },

    async toggleAccountStatus(iban: string): Promise<BankAccount> {
      const response = await client.put<BackendAccountResponse>(`/accounts/${iban}/status`, {})
      return mapAccount(response)
    },
  }
}
