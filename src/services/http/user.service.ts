import type { HttpClient } from '@/services/api/httpClient'
import type { UserManagementService } from '@/services/contracts'
import { mapUser } from '@/services/http/user.mapper'
import type { BackendUserResponse } from '@/services/http/user.mapper'

export function createHttpUserManagementService(client: HttpClient): UserManagementService {
  return {
    async getUserById(userId) {
      const response = await client.get<BackendUserResponse>(`/users/${userId}`)
      return mapUser(response)
    },
    async softDeleteUser(userId) {
      await client.delete(`/users/${userId}`)
    },
  }
}
