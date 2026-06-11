import type { AccountConfigRequest } from './approval'
import type { PageMetadata, UserRole } from './common'

export type UserApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  approvalStatus: UserApprovalStatus
  approved: boolean
  active: boolean
  blocked: boolean
  employeeCreated: boolean
  initials: string
  phoneNumber?: string
  bsn?: string
  createdAt?: string
  blockedAt?: string | null
  deletedAt?: string | null
}

export interface UserListFilters {
  role?: UserRole
  approvalStatus?: UserApprovalStatus
  blocked?: boolean
  employeeCreated?: boolean
  includeDeleted?: boolean
}

export interface UserListResult {
  items: UserProfile[]
  page: PageMetadata
}

export interface EmployeeCreateCustomerPayload {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  password: string
  bsn: string
  checkingAccount: AccountConfigRequest
  savingsAccount: AccountConfigRequest
}

export interface EmployeeCreateEmployeePayload {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  password: string
  bsn: string
}

export interface UserUpdatePayload {
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  checkingAccount?: AccountConfigRequest
  savingsAccount?: AccountConfigRequest
}
