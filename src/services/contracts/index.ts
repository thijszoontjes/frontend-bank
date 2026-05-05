import type { ApprovalListResult, ApprovalPayload } from '@/types/approval'
import type { AccountPortfolio } from '@/types/account'
import type { AuthSession, LoginPayload, RegisterPayload } from '@/types/auth'
import type { CreateTransactionPayload, Transaction } from '@/types/transaction'
import type {
  EmployeeCreateCustomerPayload,
  UserListFilters,
  UserListResult,
  UserProfile,
  UserUpdatePayload,
} from '@/types/user'

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
  getTransactionsByUser(userId: string): Promise<Transaction[]>
  getTransactionsByAccount(iban: string): Promise<Transaction[]>
  createTransaction(payload: CreateTransactionPayload): Promise<Transaction>
}

export interface ApprovalService {
  getPendingApprovals(page?: number, size?: number): Promise<ApprovalListResult>
  approveApproval(userId: string, payload: ApprovalPayload): Promise<void>
  rejectApproval(userId: string): Promise<void>
}

export interface UserManagementService {
  listUsers(page?: number, size?: number, filters?: UserListFilters): Promise<UserListResult>
  getUserById(userId: string): Promise<UserProfile>
  createCustomer(payload: EmployeeCreateCustomerPayload): Promise<UserProfile>
  updateUser(userId: string, payload: UserUpdatePayload): Promise<UserProfile>
  softDeleteUser(userId: string): Promise<void>
  blockUser(userId: string): Promise<UserProfile>
  unblockUser(userId: string): Promise<UserProfile>
}

export interface ServiceRegistry {
  auth: AuthService
  account: AccountService
  transaction: TransactionService
  approval: ApprovalService
  user: UserManagementService
}
