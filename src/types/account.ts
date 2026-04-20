export type AccountType = 'checking' | 'savings' | 'business'
export type AccountStatus = 'active' | 'review' | 'blocked'

export interface BankAccount {
  id: string
  userId: string
  name: string
  iban: string
  type: AccountType
  currency: string
  availableBalance: number
  ledgerBalance: number
  status: AccountStatus
  updatedAt: string
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
