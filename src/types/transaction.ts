export type TransactionType = 'TRANSFER' | 'ATM_DEPOSIT' | 'ATM_WITHDRAWAL'
export type TransactionStatus = 'COMPLETED' | 'REJECTED'
export type AccountType = 'CHECKING' | 'SAVINGS'
export type InitiatorRole = 'CUSTOMER' | 'EMPLOYEE' | 'ATM'

export interface Transaction {
  transactionId: number
  transactionType: TransactionType
  status: TransactionStatus
  amount: number
  currency: 'EUR'
  description?: string
  createdAt: string

  fromAccount: {
    iban: string
    accountType?: AccountType
  }

  toAccount: {
    iban: string
    accountType?: AccountType
  }

  initiator: {
    userId: number
    firstName?: string
    lastName?: string
    role: InitiatorRole
  }
}

export interface CreateTransactionPayload {
  fromAccountIban: string
  toAccountIban: string
  initiatorId: string
  amount: number
  description?: string
}
