import type { HttpClient } from '@/services/api/httpClient'
import type { AuthService } from '@/services/contracts'
import { mapUser } from '@/services/http/user.mapper'
import type { BackendUserResponse } from '@/services/http/user.mapper'

interface BackendAuthResponse {
  token: string
  tokenType: string
  expiresAt: string
  user: BackendUserResponse
}

export function createHttpAuthService(client: HttpClient): AuthService {
  return {
    async login(payload) {
      const response = await client.post<BackendAuthResponse>('/auth/login', payload)
      return {
        token: response.token,
        user: mapUser(response.user),
      }
    },
    async register(payload) {
      const response = await client.post<BackendUserResponse>('/auth/register', payload)
      return mapUser(response)
    },
    logout: async () => undefined,
    async getCurrentUser() {
      const response = await client.get<BackendUserResponse>('/users/me')
      return mapUser(response)
    },
  }
}
