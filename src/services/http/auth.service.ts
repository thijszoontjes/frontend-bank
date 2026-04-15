import type { HttpClient } from '@/services/api/httpClient'
import type { AuthService } from '@/services/contracts'

export function createHttpAuthService(client: HttpClient): AuthService {
  return {
    login: (payload) => client.post('/auth/login', payload),
    register: (payload) => client.post('/auth/register', payload),
    logout: () => client.post('/auth/logout'),
    getCurrentSession: () => client.get('/auth/session'),
  }
}
