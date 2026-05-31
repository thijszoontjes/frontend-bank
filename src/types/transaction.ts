export type TransactionType = 'TRANSACTION' | 'DEPOSIT' | 'WITHDRAWAL'
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

export interface CreateTransactionPayload {
  fromAccountIban: string
  toAccountIban: string
  initiatorId: number
  amount: number
  description?: string
}
