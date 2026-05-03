import type { UserManagementService } from '@/services/contracts'
import type { EmployeeCreateCustomerPayload, UserListFilters, UserProfile, UserUpdatePayload } from '@/types/user'

import { mockDb } from './db'
import { simulateDelay } from './shared'

function findUser(userId: string) {
  return mockDb.users.find((entry) => entry.id === userId)
}

function stripPassword(user: (typeof mockDb.users)[number]): UserProfile {
  const { password: _password, ...safeUser } = user
  return safeUser
}

function buildMaskedBsn(value: string) {
  return `***${value.slice(-4)}`
}

function sortUsers() {
  mockDb.users.sort((left, right) => {
    const leftDate = left.createdAt ? new Date(left.createdAt).getTime() : 0
    const rightDate = right.createdAt ? new Date(right.createdAt).getTime() : 0
    return rightDate - leftDate
  })
}

function matchesFilters(user: (typeof mockDb.users)[number], filters: UserListFilters) {
  if (filters.role && user.role !== filters.role) {
    return false
  }

  if (filters.approvalStatus && user.approvalStatus !== filters.approvalStatus) {
    return false
  }

  if (typeof filters.blocked === 'boolean' && user.blocked !== filters.blocked) {
    return false
  }

  if (typeof filters.employeeCreated === 'boolean' && user.employeeCreated !== filters.employeeCreated) {
    return false
  }

  if (!filters.includeDeleted && user.deletedAt) {
    return false
  }

  return true
}

function createAccountRecord(
  userId: string,
  type: 'checking' | 'savings',
  ibanPrefix: string,
  absoluteLimit: number,
  dailyLimit: number,
) {
  return {
    id: `acc-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    name: type === 'checking' ? 'Checking account' : 'Savings account',
    iban: `NL${ibanPrefix}BANK${Math.random().toString().slice(2, 12)}`,
    type,
    currency: 'EUR',
    availableBalance: 0,
    ledgerBalance: 0,
    status: 'active' as const,
    updatedAt: new Date().toISOString(),
    absoluteLimit,
    dailyLimit,
  }
}

export function createMockUserManagementService(): UserManagementService {
  return {
    async listUsers(page = 0, size = 20, filters = {}) {
      await simulateDelay(150)

      const filteredUsers = mockDb.users.filter((entry) => matchesFilters(entry, filters))
      const start = page * size

      return {
        items: filteredUsers.slice(start, start + size).map(stripPassword),
        page: {
          page,
          size,
          totalElements: filteredUsers.length,
          totalPages: Math.max(1, Math.ceil(filteredUsers.length / size)),
        },
      }
    },
    async getUserById(userId) {
      await simulateDelay(150)

      const user = findUser(userId)

      if (!user) {
        throw new Error('User not found in mock dataset.')
      }

      return stripPassword(user)
    },
    async createCustomer(payload: EmployeeCreateCustomerPayload) {
      await simulateDelay(200)

      const existingUser = mockDb.users.find(
        (entry) =>
          entry.email.toLowerCase() === payload.email.toLowerCase() || entry.bsn === buildMaskedBsn(payload.bsn),
      )

      if (existingUser) {
        throw new Error('A user with this email address or BSN already exists.')
      }

      const userId = `user-${Date.now()}`
      const user = {
        id: userId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        bsn: buildMaskedBsn(payload.bsn),
        password: payload.password,
        role: 'customer' as const,
        approvalStatus: 'approved' as const,
        approved: true,
        active: true,
        blocked: false,
        employeeCreated: true,
        initials: `${payload.firstName[0] ?? ''}${payload.lastName[0] ?? ''}`.toUpperCase(),
        createdAt: new Date().toISOString(),
        blockedAt: null,
        deletedAt: null,
      }

      mockDb.users.unshift(user)
      mockDb.accounts.unshift(
        createAccountRecord(
          userId,
          'checking',
          '20',
          payload.checkingAccount.absoluteLimit,
          payload.checkingAccount.dailyLimit,
        ),
        createAccountRecord(
          userId,
          'savings',
          '91',
          payload.savingsAccount.absoluteLimit,
          payload.savingsAccount.dailyLimit,
        ),
      )
      sortUsers()

      return stripPassword(user)
    },
    async updateUser(userId: string, payload: UserUpdatePayload) {
      await simulateDelay(180)

      const user = findUser(userId)

      if (!user) {
        throw new Error('User not found in mock dataset.')
      }

      if (payload.email) {
        const duplicate = mockDb.users.find(
          (entry) => entry.id !== userId && entry.email.toLowerCase() === payload.email!.toLowerCase(),
        )

        if (duplicate) {
          throw new Error('A user with this email address already exists.')
        }
      }

      Object.assign(user, {
        firstName: payload.firstName ?? user.firstName,
        lastName: payload.lastName ?? user.lastName,
        email: payload.email ?? user.email,
        phoneNumber: payload.phoneNumber ?? user.phoneNumber,
        initials: `${(payload.firstName ?? user.firstName)[0] ?? ''}${(payload.lastName ?? user.lastName)[0] ?? ''}`.toUpperCase(),
      })

      const checkingAccount = mockDb.accounts.find((account) => account.userId === userId && account.type === 'checking')
      const savingsAccount = mockDb.accounts.find((account) => account.userId === userId && account.type === 'savings')

      if (payload.checkingAccount && checkingAccount) {
        checkingAccount.absoluteLimit = payload.checkingAccount.absoluteLimit
        checkingAccount.dailyLimit = payload.checkingAccount.dailyLimit
      }

      if (payload.savingsAccount && savingsAccount) {
        savingsAccount.absoluteLimit = payload.savingsAccount.absoluteLimit
        savingsAccount.dailyLimit = payload.savingsAccount.dailyLimit
      }

      return stripPassword(user)
    },
    async softDeleteUser(userId) {
      await simulateDelay(150)

      const user = findUser(userId)

      if (!user) {
        throw new Error('User not found in mock dataset.')
      }

      user.deletedAt = new Date().toISOString()
      user.active = false
      mockDb.approvals = mockDb.approvals.filter((approval) => approval.id !== userId)
    },
    async blockUser(userId) {
      await simulateDelay(150)

      const user = findUser(userId)

      if (!user) {
        throw new Error('User not found in mock dataset.')
      }

      user.blocked = true
      user.blockedAt = new Date().toISOString()
      return stripPassword(user)
    },
    async unblockUser(userId) {
      await simulateDelay(150)

      const user = findUser(userId)

      if (!user) {
        throw new Error('User not found in mock dataset.')
      }

      user.blocked = false
      user.blockedAt = null
      return stripPassword(user)
    },
  }
}
