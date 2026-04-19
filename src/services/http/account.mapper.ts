import type { AccountPortfolio, AccountSummary, BankAccount } from '@/types/account'

interface BackendAccountResponse {
  iban: string
  balance: number
  accountType: 'CHECKING' | 'SAVINGS'
  status: 'OPEN' | 'CLOSED'
  absoluteLimit: number
  dailyLimit: number
  createdAt: string
  userId: number
}

interface BackendAccountPortfolioResponse {
  accounts: BackendAccountResponse[]
  totals: {
    combinedBalance: number
    checkingBalance: number
    savingsBalance: number
  }
}

function mapAccountType(accountType: BackendAccountResponse['accountType']): BankAccount['type'] {
  return accountType === 'CHECKING' ? 'checking' : 'savings'
}

function mapStatus(status: BackendAccountResponse['status']): BankAccount['status'] {
  return status === 'OPEN' ? 'active' : 'blocked'
}

function mapAccountName(accountType: BackendAccountResponse['accountType']) {
  return accountType === 'CHECKING' ? 'Checking account' : 'Savings account'
}

function mapAccount(account: BackendAccountResponse): BankAccount {
  return {
    id: account.iban,
    userId: String(account.userId),
    name: mapAccountName(account.accountType),
    iban: account.iban,
    type: mapAccountType(account.accountType),
    currency: 'EUR',
    availableBalance: account.balance,
    ledgerBalance: account.balance,
    status: mapStatus(account.status),
    updatedAt: account.createdAt,
  }
}

function mapSummary(response: BackendAccountPortfolioResponse): AccountSummary {
  return {
    totalBalance: response.totals.combinedBalance,
    liquidBalance: response.totals.combinedBalance,
    accountsCount: response.accounts.length,
    mainCurrency: 'EUR',
  }
}

export function mapAccountPortfolio(response: BackendAccountPortfolioResponse): AccountPortfolio {
  return {
    accounts: response.accounts.map(mapAccount),
    summary: mapSummary(response),
  }
}

export type { BackendAccountPortfolioResponse }
