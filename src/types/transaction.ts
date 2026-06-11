import type { PageMetadata } from './common'

export type TransactionType = 'TRANSACTION' | 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL'
export type TransactionStatus = 'COMPLETED' | 'REJECTED'

export interface UserResponseDto {
  userId: number
  firstName: string
  lastName: string
  email: string
}

export interface Transaction {
  transactionId: number
  amount: number
  createdAt: string
  initiatedBy: UserResponseDto
  type: TransactionType
  toAccount: string
  fromAccount: string
  description?: string
  status?: TransactionStatus
}

export type AmountComparisonOperator = 'gt' | 'eq' | 'lt'

export interface TransactionListFilters {
  search?: string
  startDate?: string
  endDate?: string
  amountOperator?: AmountComparisonOperator
  amountValue?: number
}

export interface TransactionListResult {
  items: Transaction[]
  page: PageMetadata
}

export interface CreateTransactionPayload {
  fromAccountIban: string
  toAccountIban: string
  initiatorId: number
  amount: number
  description?: string
}
