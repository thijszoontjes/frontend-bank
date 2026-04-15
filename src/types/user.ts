import type { UserRole } from './common'

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  department?: string
  customerSegment?: string
  initials: string
}
