import { SESSION_STORAGE_KEY } from '@/constants/auth'
import type { AuthSession } from '@/types/auth'
import { readStorage } from '@/utils/storage'

export interface HttpClient {
  get<T>(path: string, init?: RequestInit): Promise<T>
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>
  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>
}

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as {
      message?: string
      validationErrors?: Array<{ field: string; message: string }>
    }

    if (payload.validationErrors?.length) {
      return payload.validationErrors.map((issue) => `${issue.field}: ${issue.message}`).join(', ')
    }

    return payload.message ?? `Request failed with status ${response.status}`
  } catch {
    return `Request failed with status ${response.status}`
  }
}

export function createHttpClient(baseUrl: string): HttpClient {
  function getAuthorizationHeader() {
    const session = readStorage<AuthSession>(SESSION_STORAGE_KEY)
    return session?.token ? { Authorization: `Bearer ${session.token}` } : {}
  }

  async function request<T>(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers)
    headers.set('Content-Type', 'application/json')

    const authorizationHeader = getAuthorizationHeader().Authorization
    if (authorizationHeader) {
      headers.set('Authorization', authorizationHeader)
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    })

    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  return {
    get: (path, init) => request(path, { ...init, method: 'GET' }),
    post: (path, body, init) =>
      request(path, {
        ...init,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),
    patch: (path, body, init) =>
      request(path, {
        ...init,
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      }),
  }
}
