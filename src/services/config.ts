import type { ApiMode } from '@/types/common'

const rawMode = import.meta.env.VITE_API_MODE?.toLowerCase()
const apiMode: ApiMode = rawMode === 'mock' ? 'mock' : 'live'

export const appConfig = {
  apiMode,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1',
}
