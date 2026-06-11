import type { ApprovalListResult, ApprovalPayload } from '@/types/approval'
import type { AccountListFilters, AccountListResult, AccountPortfolio, IbanSearchResult } from '@/types/account'
import type { AtmDepositPayload, AtmTransactionResult, AtmWithdrawPayload } from '@/types/atm'
import type { AuthSession, LoginPayload, RegisterPayload } from '@/types/auth'
import type { CreateTransactionPayload, Transaction, TransactionListFilters, TransactionListResult } from '@/types/transaction'
import type {
  EmployeeCreateCustomerPayload,
  EmployeeCreateEmployeePayload,
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
  listAllAccounts(page?: number, size?: number, filters?: AccountListFilters): Promise<AccountListResult>
  searchIbanByName(firstName: string, lastName: string): Promise<IbanSearchResult[]>
}

export interface AtmService {
  deposit(payload: AtmDepositPayload): Promise<AtmTransactionResult>
  withdraw(payload: AtmWithdrawPayload): Promise<AtmTransactionResult>
}

export interface TransactionService {
  listTransactions(page?: number, size?: number, sortBy?: string, sortDir?: string, filters?: TransactionListFilters): Promise<TransactionListResult>
  listTransactionsByAccount(iban: string, page?: number, size?: number, filters?: TransactionListFilters): Promise<TransactionListResult>
  listTransactionsByUser(userId: string, page?: number, size?: number, filters?: TransactionListFilters): Promise<TransactionListResult>
  getTransactionsByUser(userId: string): Promise<Transaction[]>
  createTransaction(payload: CreateTransactionPayload): Promise<Transaction>
}

export interface ApprovalService {
  getPendingApprovals(page?: number, size?: number): Promise<ApprovalListResult>
  approveApproval(userId: string, payload: ApprovalPayload): Promise<void>
  rejectApproval(userId: string, reason?: string): Promise<void>
}

export interface UserManagementService {
  listUsers(page?: number, size?: number, filters?: UserListFilters): Promise<UserListResult>
  getUserById(userId: string): Promise<UserProfile>
  createCustomer(payload: EmployeeCreateCustomerPayload): Promise<UserProfile>
  createEmployee(payload: EmployeeCreateEmployeePayload): Promise<UserProfile>
  updateUser(userId: string, payload: UserUpdatePayload): Promise<UserProfile>
  softDeleteUser(userId: string): Promise<void>
  blockUser(userId: string): Promise<UserProfile>
  unblockUser(userId: string): Promise<UserProfile>
}

export interface ServiceRegistry {
  auth: AuthService
  account: AccountService
  atm: AtmService
  transaction: TransactionService
  approval: ApprovalService
  user: UserManagementService
}
