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
  iban: string
  amount: number
}

export interface AtmWithdrawPayload {
  iban: string
  amount: number
}
