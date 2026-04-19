import { computed } from 'vue'

import { useAuthStore } from '@/stores/auth'

export function useCurrentUser() {
  const authStore = useAuthStore()

  return {
    user: computed(() => authStore.user),
    userId: computed(() => authStore.user?.id ?? ''),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    role: computed(() => authStore.role),
    isEmployee: computed(() => authStore.role === 'employee'),
    isPendingCustomer: computed(() => authStore.isPendingCustomer),
  }
}
