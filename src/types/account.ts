export type AccountType = 'checking' | 'savings' | 'business'
export type AccountStatus = 'active' | 'review' | 'blocked'
export type AccountBalanceOperator = 'gt' | 'eq' | 'lt'

export interface AccountListFilters {
  type?: 'checking' | 'savings'
  status?: AccountStatus
  balanceOperator?: AccountBalanceOperator
  balanceValue?: number
  createdAfter?: string
}

export interface AccountListResult {
  items: BankAccount[]
  page: import('@/types/common').PageMetadata
}

export interface BankAccount {
  id: string
  userId: string
  name: string
  iban: string
  type: AccountType
  currency: string
  availableBalance: number
  status: AccountStatus
  createdAt: string
  updatedAt?: string
  absoluteLimit?: number
  dailyLimit?: number
}

export interface AccountSummary {
  totalBalance: number
  liquidBalance: number
  accountsCount: number
  mainCurrency: string
}

export interface AccountPortfolio {
  accounts: BankAccount[]
  summary: AccountSummary
}

export interface IbanSearchResult {
  iban: string
  ownerName: string
}
