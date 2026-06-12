import type { HttpClient } from '@/services/api/httpClient'
import type { AccountService } from '@/services/contracts'
import { mapAccountPortfolio } from '@/services/http/account.mapper'
import type { BackendAccountPortfolioResponse } from '@/services/http/account.mapper'
import type { PageMetadata } from '@/types/common'
import type { AccountListFilters, AccountListResult, BankAccount, IbanSearchResult } from '@/types/account'

interface BackendAccountResponse {
  iban: string
  balance: number
  accountType: 'CHECKING' | 'SAVINGS'
  status: 'OPEN' | 'CLOSED'
  absoluteLimit: number
  dailyLimit: number
  createdAt: string
  userId: number
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
        pageNr: String(page),
        pageSize: String(size),
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

    async searchIbanByName(firstName, lastName): Promise<IbanSearchResult[]> {
      const params = new URLSearchParams({ firstName, lastName })
      return client.get<IbanSearchResult[]>(`/accounts/search?${params.toString()}`)
    },

    async getAccountByIban(iban: string): Promise<BankAccount> {
      const response = await client.get<BackendAccountResponse>(`/accounts/${iban}`)
      return mapAccount(response)
    },

    async updateAccountStatus(iban: string): Promise<BankAccount> {
      const response = await client.put<BackendAccountResponse>(`/accounts/${iban}/status`)
      return mapAccount(response)
    },

    async updateAccountLimits(iban: string, absoluteLimit: number, dailyLimit: number): Promise<BankAccount> {
      const response = await client.put<BackendAccountResponse>(`/accounts/${iban}/limits`, {
        absoluteLimit,
        dailyLimit,
      })
      return mapAccount(response)
    },
  }
}
