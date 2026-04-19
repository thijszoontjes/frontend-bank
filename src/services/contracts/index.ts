import type { ApprovalItem, ApprovalPayload } from '@/types/approval'
import type { AccountSummary, BankAccount } from '@/types/account'
import type { AuthSession, LoginPayload, RegisterPayload } from '@/types/auth'
import type { TransactionItem } from '@/types/transaction'
import type { UserProfile } from '@/types/user'

export interface AuthService {
  login(payload: LoginPayload): Promise<AuthSession>
  register(payload: RegisterPayload): Promise<UserProfile>
  logout(): Promise<void>
  getCurrentUser(): Promise<UserProfile>
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
  approveApproval(userId: string, payload: ApprovalPayload): Promise<void>
  rejectApproval(userId: string): Promise<void>
}

export interface ServiceRegistry {
  auth: AuthService
  account: AccountService
  transaction: TransactionService
  approval: ApprovalService
}
