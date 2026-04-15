import type { UserRole } from './common'
import type { UserProfile } from './user'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
}

export interface AuthSession {
  token: string
  user: UserProfile
}
