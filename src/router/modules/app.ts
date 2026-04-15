import type { RouteRecordRaw } from 'vue-router'

import AppLayout from '@/layouts/AppLayout.vue'

export const appRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        redirect: {
          name: 'dashboard',
        },
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/app/DashboardView.vue'),
        meta: {
          title: 'Dashboard',
          requiresAuth: true,
        },
      },
      {
        path: 'accounts',
        name: 'accounts',
        component: () => import('@/views/app/AccountsView.vue'),
        meta: {
          title: 'Accounts overview',
          requiresAuth: true,
        },
      },
      {
        path: 'transactions',
        name: 'transactions',
        component: () => import('@/views/app/TransactionsView.vue'),
        meta: {
          title: 'Transactions',
          requiresAuth: true,
        },
      },
      {
        path: 'approvals',
        name: 'approvals',
        component: () => import('@/views/app/PendingApprovalsView.vue'),
        meta: {
          title: 'Pending approvals',
          requiresAuth: true,
          roles: ['employee'],
        },
      },
    ],
  },
]
