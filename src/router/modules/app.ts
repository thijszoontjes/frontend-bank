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
          title: 'Accounts',
          requiresAuth: true,
          roles: ['customer'],
        },
      },
      {
        path: 'accounts/:iban/transactions',
        name: 'account-transactions',
        component: () => import('@/views/app/AccountTransactionsView.vue'),
        meta: {
          title: 'Account transactions',
          requiresAuth: true,
          roles: ['customer'],
        },
      },
      {
        path: 'atm',
        name: 'atm',
        component: () => import('@/views/app/ATMView.vue'),
        meta: {
          title: 'ATM',
          requiresAuth: true,
          roles: ['customer'],
        },
      },
      {
        path: 'approvals',
        name: 'approvals',
        component: () => import('@/views/app/PendingApprovalsView.vue'),
        meta: {
          title: 'Approvals',
          requiresAuth: true,
          roles: ['employee'],
        },
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/app/EmployeeUsersView.vue'),
        meta: {
          title: 'Users',
          requiresAuth: true,
          roles: ['employee'],
        },
      },
      {
        path: 'users/:userId/transactions',
        name: 'customer-transactions',
        component: () => import('@/views/app/CustomerTransactionsView.vue'),
        meta: {
          title: 'Customer transactions',
          requiresAuth: true,
          roles: ['employee'],
        },
      },
      {
        path: 'users/new',
        name: 'user-create',
        component: () => import('@/views/app/CreateCustomerView.vue'),
        meta: {
          title: 'New customer',
          requiresAuth: true,
          roles: ['employee'],
        },
      },
    ],
  },
]
