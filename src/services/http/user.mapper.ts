import type { UserRole } from '@/types/common'
import type { UserApprovalStatus, UserProfile } from '@/types/user'

interface BackendUserResponse {
  userId: number
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  bsn?: string
  role: 'CUSTOMER' | 'EMPLOYEE'
  approved: boolean
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt?: string
  deletedAt?: string | null
}

function mapRole(role: BackendUserResponse['role']): UserRole {
  return role === 'EMPLOYEE' ? 'employee' : 'customer'
}

function mapApprovalStatus(
  status: BackendUserResponse['approvalStatus'],
): UserApprovalStatus {
  switch (status) {
    case 'APPROVED':
      return 'approved'
    case 'REJECTED':
      return 'rejected'
    default:
      return 'pending'
  }
}

export function mapUser(user: BackendUserResponse): UserProfile {
  return {
    id: String(user.userId),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: mapRole(user.role),
    approvalStatus: mapApprovalStatus(user.approvalStatus),
    approved: user.approved,
    phoneNumber: user.phoneNumber,
    bsn: user.bsn,
    createdAt: user.createdAt,
    deletedAt: user.deletedAt ?? null,
    initials: `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase(),
  }
}

export type { BackendUserResponse }
