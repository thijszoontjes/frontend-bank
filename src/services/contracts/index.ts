import type { ApprovalItem } from '@/types/approval'
import type { AccountSummary, BankAccount } from '@/types/account'
import type { AuthSession, LoginPayload, RegisterPayload } from '@/types/auth'
import type { TransactionItem } from '@/types/transaction'

export interface AuthService {
  login(payload: LoginPayload): Promise<AuthSession>
  register(payload: RegisterPayload): Promise<AuthSession>
  logout(): Promise<void>
  getCurrentSession(): Promise<AuthSession | null>
}

export interface AccountService {
  getAccountsByUser(userId: string): Promise<BankAccount[]>
  getAccountSummary(userId: string): Promise<AccountSummary>
}

export interface TransactionService {
  getTransactionsByUser(userId: string): Promise<TransactionItem[]>
}

export interface ApprovalService {
  getPendingApprovals(): Promise<ApprovalItem[]>
  approveApproval(id: string): Promise<ApprovalItem>
  rejectApproval(id: string): Promise<ApprovalItem>
}

export interface ServiceRegistry {
  auth: AuthService
  account: AccountService
  transaction: TransactionService
  approval: ApprovalService
}
