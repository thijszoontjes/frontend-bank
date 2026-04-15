import type { Router } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { pinia } from '@/stores/index'

const APP_TITLE = 'Frontend Bank'

export function registerRouterGuards(router: Router) {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore(pinia)

    if (!authStore.initialized) {
      await authStore.hydrate()
    }

    if (to.meta.guestOnly && authStore.isAuthenticated) {
      return { name: 'dashboard' }
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return {
        name: 'login',
        query: to.fullPath === '/' ? undefined : { redirect: to.fullPath },
      }
    }

    if (to.meta.roles?.length && authStore.role && !to.meta.roles.includes(authStore.role)) {
      return { name: 'dashboard' }
    }

    document.title = to.meta.title ? `${to.meta.title} | ${APP_TITLE}` : APP_TITLE

    return true
  })
}
