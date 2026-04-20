import type { UserProfile } from './user'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  bsn: string
  password: string
}

export interface AuthSession {
  token: string
  user: UserProfile
}
