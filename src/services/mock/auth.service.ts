import type { AuthService } from '@/services/contracts'
import type { AuthSession, LoginPayload, RegisterPayload } from '@/types/auth'

import { mockDb } from './db'
import { createToken, simulateDelay } from './shared'

function toSession(user: (typeof mockDb.users)[number]): AuthSession {
  const { password: _password, ...safeUser } = user
  return {
    token: createToken(),
    user: safeUser,
  }
}

export function createMockAuthService(): AuthService {
  return {
    async login(payload: LoginPayload) {
      await simulateDelay()

      const user = mockDb.users.find(
        (entry) => entry.email.toLowerCase() === payload.email.toLowerCase() && entry.password === payload.password,
      )

      if (!user) {
        throw new Error('Invalid credentials. Use one of the demo accounts on the login screen.')
      }

      return toSession(user)
    },
    async register(payload: RegisterPayload) {
      await simulateDelay(350)

      const exists = mockDb.users.some((entry) => entry.email.toLowerCase() === payload.email.toLowerCase())

      if (exists) {
        throw new Error('A user with this email already exists in the mock dataset.')
      }

      const user = {
        id: `user-${Date.now()}`,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        initials: `${payload.firstName[0] ?? ''}${payload.lastName[0] ?? ''}`.toUpperCase(),
        department: payload.role === 'employee' ? 'Operations' : undefined,
        customerSegment: payload.role === 'customer' ? 'Retail Plus' : undefined,
      }

      mockDb.users.unshift(user)

      return toSession(user)
    },
    async logout() {
      await simulateDelay(150)
    },
    async getCurrentSession() {
      await simulateDelay(100)
      return null
    },
  }
}
