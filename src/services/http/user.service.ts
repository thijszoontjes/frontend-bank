import type { HttpClient } from '@/services/api/httpClient'
import type { UserManagementService } from '@/services/contracts'
import { mapUser } from '@/services/http/user.mapper'
import type { BackendUserResponse } from '@/services/http/user.mapper'
import type { PageMetadata } from '@/types/common'
import type { UserListFilters } from '@/types/user'

interface PagedUsersResponse {
  items: BackendUserResponse[]
  page: PageMetadata
}

interface ApprovalResponse {
  user: BackendUserResponse
}

function mapRoleParam(role: UserListFilters['role']) {
  if (!role) {
    return null
  }

  return role === 'employee' ? 'EMPLOYEE' : 'CUSTOMER'
}

function mapApprovalStatusParam(status: UserListFilters['approvalStatus']) {
  return status ?? null
}

function buildUserQuery(page: number, size: number, filters: UserListFilters = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  const role = mapRoleParam(filters.role)
  const approvalStatus = mapApprovalStatusParam(filters.approvalStatus)

  if (role) {
    params.set('role', role)
  }

  if (approvalStatus) {
    params.set('approvalStatus', approvalStatus)
  }

  if (typeof filters.blocked === 'boolean') {
    params.set('blocked', String(filters.blocked))
  }

  if (typeof filters.employeeCreated === 'boolean') {
    params.set('employeeCreated', String(filters.employeeCreated))
  }

  if (typeof filters.includeDeleted === 'boolean') {
    params.set('includeDeleted', String(filters.includeDeleted))
  }

  return params.toString()
}

export function createHttpUserManagementService(client: HttpClient): UserManagementService {
  return {
    async listUsers(page = 0, size = 20, filters = {}) {
      const response = await client.get<PagedUsersResponse>(`/users?${buildUserQuery(page, size, filters)}`)

      return {
        items: response.items.map(mapUser),
        page: response.page,
      }
    },
    async getUserById(userId) {
      const response = await client.get<BackendUserResponse>(`/users/${userId}`)
      return mapUser(response)
    },
    async createCustomer(payload) {
      const response = await client.post<ApprovalResponse>('/users', payload)
      return mapUser(response.user)
    },
    async createEmployee(payload) {
      const response = await client.post<BackendUserResponse>('/users/employees', payload)
      return mapUser(response)
    },
    async updateUser(userId, payload) {
      const response = await client.patch<BackendUserResponse>(`/users/${userId}`, payload)
      return mapUser(response)
    },
    async softDeleteUser(userId) {
      await client.delete(`/users/${userId}`)
    },
    async blockUser(userId) {
      const response = await client.put<BackendUserResponse>(`/users/${userId}/block`)
      return mapUser(response)
    },
    async unblockUser(userId) {
      const response = await client.put<BackendUserResponse>(`/users/${userId}/unblock`)
      return mapUser(response)
    },
  }
}
