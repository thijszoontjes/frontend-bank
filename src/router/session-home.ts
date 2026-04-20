import type { RouteLocationRaw } from 'vue-router'

import type { useAuthStore } from '@/stores/auth'

type AuthStore = ReturnType<typeof useAuthStore>

export function resolveHomeRoute(authStore: AuthStore): RouteLocationRaw {
  if (authStore.isPendingCustomer) {
    return { name: 'pending' }
  }

  return { name: 'dashboard' }
}
