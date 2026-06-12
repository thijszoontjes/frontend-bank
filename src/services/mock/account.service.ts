import type { AccountService } from '@/services/contracts'
import type { AccountListFilters, AccountListResult, BankAccount, IbanSearchResult } from '@/types/account'

import { mockDb } from './db'
import { simulateDelay } from './shared'

function buildSummary(userId: string) {
  const accounts = mockDb.accounts.filter((account) => account.userId === userId)
  const totalBalance = accounts.reduce((sum, account) => sum + account.availableBalance, 0)
  const liquidBalance = accounts.reduce((sum, account) => sum + account.availableBalance, 0)

  return {
    totalBalance,
    liquidBalance,
    accountsCount: accounts.length,
    mainCurrency: accounts[0]?.currency ?? 'EUR',
  }
}

function applyAccountFilters(accounts: BankAccount[], filters: AccountListFilters): BankAccount[] {
  let result = accounts

  if (filters.type) {
    result = result.filter((a) => a.type === filters.type)
  }

  if (filters.status) {
    result = result.filter((a) => a.status === filters.status)
  }

  if (filters.balanceOperator !== undefined && filters.balanceValue !== undefined) {
    const value = filters.balanceValue

    if (filters.balanceOperator === 'gt') {
      result = result.filter((a) => a.availableBalance > value)
    } else if (filters.balanceOperator === 'lt') {
      result = result.filter((a) => a.availableBalance < value)
    } else if (filters.balanceOperator === 'eq') {
      result = result.filter((a) => a.availableBalance === value)
    }
  }

  if (filters.createdAfter) {
    const from = new Date(filters.createdAfter).getTime()

    result = result.filter((a) => new Date(a.createdAt).getTime() >= from)
  }

  return result
}

export function createMockAccountService(): AccountService {
  return {
    async getAccountPortfolio(userId: string) {
      await simulateDelay(180)

      return {
        accounts: mockDb.accounts.filter((account) => account.userId === userId),
        summary: buildSummary(userId),
      }
    },

    async listAllAccounts(page = 0, size = 25, filters: AccountListFilters = {}): Promise<AccountListResult> {
      await simulateDelay(200)

      const customerIds = new Set(
        mockDb.users
          .filter((u) => u.role === 'customer')
          .map((u) => u.id),
      )

      const customerAccounts = mockDb.accounts.filter((a) => customerIds.has(a.userId))
      const filtered = applyAccountFilters(customerAccounts, filters)
      const totalElements = filtered.length
      const totalPages = Math.max(1, Math.ceil(totalElements / size))
      const safePage = Math.min(page, totalPages - 1)
      const items = filtered.slice(safePage * size, safePage * size + size)

      return {
        items,
        page: {
          page: safePage,
          size,
          totalElements,
          totalPages,
        },
      }
    },

    async searchIbanByName(firstName, lastName): Promise<IbanSearchResult[]> {
      await simulateDelay(150)
      const first = firstName.trim().toLowerCase()
      const last = lastName.trim().toLowerCase()

      return mockDb.users
        .filter(
          (u) =>
            u.role === 'customer' &&
            u.firstName.toLowerCase() === first &&
            u.lastName.toLowerCase() === last &&
            !u.deletedAt,
        )
        .flatMap((u) =>
          mockDb.accounts
            .filter((a) => a.userId === u.id && a.type === 'checking' && a.status === 'active')
            .map((a) => ({ iban: a.iban, ownerName: `${u.firstName} ${u.lastName}` })),
        )
    },

    async getAccountByIban(iban: string): Promise<BankAccount> {
      await simulateDelay(120)
      const account = mockDb.accounts.find((a) => a.iban === iban)
      if (!account) throw new Error(`Account ${iban} not found`)
      return { ...account }
    },

    async updateAccountStatus(iban: string): Promise<BankAccount> {
      await simulateDelay(150)
      const account = mockDb.accounts.find((a) => a.iban === iban)
      if (!account) throw new Error(`Account ${iban} not found`)
      account.status = account.status === 'active' ? 'blocked' : 'active'
      return { ...account }
    },

    async updateAccountLimits(iban: string, absoluteLimit: number, dailyLimit: number): Promise<BankAccount> {
      await simulateDelay(150)
      const account = mockDb.accounts.find((a) => a.iban === iban)
      if (!account) throw new Error(`Account ${iban} not found`)
      account.absoluteLimit = absoluteLimit
      account.dailyLimit = dailyLimit
      return { ...account }
    },
  }
}
