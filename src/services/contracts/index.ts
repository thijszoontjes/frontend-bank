import type { ApprovalListResult, ApprovalPayload } from '@/types/approval'
import type { AccountPortfolio } from '@/types/account'
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
  getAccountPortfolio(userId: string): Promise<AccountPortfolio>
}

export interface TransactionService {
  getTransactionsByUser(userId: string): Promise<TransactionItem[]>
}

export interface ApprovalService {
  getPendingApprovals(page?: number, size?: number): Promise<ApprovalListResult>
  approveApproval(userId: string, payload: ApprovalPayload): Promise<void>
  rejectApproval(userId: string): Promise<void>
}

export interface UserManagementService {
  getUserById(userId: string): Promise<UserProfile>
  softDeleteUser(userId: string): Promise<void>
}

export interface ServiceRegistry {
  auth: AuthService
  account: AccountService
  transaction: TransactionService
  approval: ApprovalService
  user: UserManagementService
}
