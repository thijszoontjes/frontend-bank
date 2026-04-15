export type TransactionDirection = 'credit' | 'debit'
export type TransactionStatus = 'completed' | 'pending' | 'flagged'

export interface TransactionItem {
  id: string
  userId: string
  accountId: string
  description: string
  counterparty: string
  category: string
  amount: number
  currency: string
  direction: TransactionDirection
  status: TransactionStatus
  bookedAt: string
}
