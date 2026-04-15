import { createRouter, createWebHistory } from 'vue-router'

import { registerRouterGuards } from './guards'
import { appRoutes } from './modules/app'
import { authRoutes } from './modules/auth'
import { systemRoutes } from './modules/system'

const router = createRouter({
  history: createWebHistory(),
  routes: [...authRoutes, ...appRoutes, ...systemRoutes],
  scrollBehavior() {
    return {
      top: 0,
    }
  },
})

registerRouterGuards(router)

export default router
