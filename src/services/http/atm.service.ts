import type { HttpClient } from '@/services/api/httpClient'
import type { AtmService } from '@/services/contracts'

export function createHttpAtmService(client: HttpClient): AtmService {
  return {
    async deposit(payload) {
      return client.post('/atm/deposit', payload)
    },
    async withdraw(payload) {
      return client.post('/atm/withdraw', payload)
    },
  }
}
