import 'vue-router'

import type { UserRole } from '@/types/common'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    guestOnly?: boolean
    pendingOnly?: boolean
    roles?: UserRole[]
  }
}
