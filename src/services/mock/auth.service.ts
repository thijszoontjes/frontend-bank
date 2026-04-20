import type { AuthService } from '@/services/contracts'
import type { AuthSession, LoginPayload, RegisterPayload } from '@/types/auth'

import { SESSION_STORAGE_KEY } from '@/constants/auth'
import { readStorage } from '@/utils/storage'

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

      if (user.blocked || user.deletedAt || !user.active || user.approvalStatus === 'rejected') {
        throw new Error('User is blocked, rejected, or deactivated.')
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
        phoneNumber: payload.phoneNumber,
        bsn: `***${payload.bsn.slice(-4)}`,
        password: payload.password,
        role: 'customer' as const,
        approvalStatus: 'pending' as const,
        approved: false,
        active: true,
        blocked: false,
        employeeCreated: false,
        initials: `${payload.firstName[0] ?? ''}${payload.lastName[0] ?? ''}`.toUpperCase(),
        createdAt: new Date().toISOString(),
        blockedAt: null,
        deletedAt: null,
      }

      mockDb.users.unshift(user)

      const { password: _password, ...safeUser } = user
      return safeUser
    },
    async logout() {
      await simulateDelay(150)
    },
    async getCurrentUser() {
      await simulateDelay(100)
      const session = readStorage<AuthSession>(SESSION_STORAGE_KEY)

      if (!session?.user?.id) {
        throw new Error('No mock session found.')
      }

      const user = mockDb.users.find((entry) => entry.id === session.user.id)

      if (!user) {
        throw new Error('Mock user not found.')
      }

      const { password: _password, ...safeUser } = user
      return safeUser
    },
  }
}
