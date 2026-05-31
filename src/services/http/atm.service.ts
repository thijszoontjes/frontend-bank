import type { HttpClient } from '@/services/api/httpClient'
import type { AtmService } from '@/services/contracts'

export function createHttpAtmService(client: HttpClient): AtmService {
  return {
    async deposit(payload) {
      const body = {
        iban: (payload as any).toAccountIban ?? (payload as any).iban,
        amount: payload.amount,
        description: payload.description,
      }

      return client.post('/transactions/atm/deposit', body)
    },
    async withdraw(payload) {
      const body = {
        iban: (payload as any).fromAccountIban ?? (payload as any).iban,
        amount: payload.amount,
        description: payload.description,
      }

      return client.post('/transactions/atm/withdraw', body)
    },
  }
}
