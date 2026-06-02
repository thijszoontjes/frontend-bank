export type AtmTransactionType = 'DEPOSIT' | 'WITHDRAWAL'

export interface AtmTransactionResult {
  transactionId: number
  iban: string
  amount: number
  newBalance: number
  type: AtmTransactionType
  createdAt: string
}

export interface AtmDepositPayload {
  toAccountIban: string
  amount: number
  description?: string
}

export interface AtmWithdrawPayload {
  fromAccountIban: string
  amount: number
  description?: string
}
