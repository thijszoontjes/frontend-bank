import type { UserRole } from './common'

export type UserApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  approvalStatus: UserApprovalStatus
  approved: boolean
  initials: string
  phoneNumber?: string
  bsn?: string
  createdAt?: string
  deletedAt?: string | null
}
