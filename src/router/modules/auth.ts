import type { RouteRecordRaw } from 'vue-router'

import AuthLayout from '@/layouts/AuthLayout.vue'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AuthLayout,
    children: [
      {
        path: '',
        redirect: {
          name: 'login',
        },
      },
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: {
          title: 'Login',
          guestOnly: true,
        },
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/views/auth/RegisterView.vue'),
        meta: {
          title: 'Register',
          guestOnly: true,
        },
      },
      {
        path: 'pending',
        name: 'pending',
        component: () => import('@/views/auth/PendingApprovalView.vue'),
        meta: {
          title: 'Pending approval',
          requiresAuth: true,
          pendingOnly: true,
        },
      },
    ],
  },
]
