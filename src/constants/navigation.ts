import type { UserRole } from '@/types/common'

export interface NavigationItem {
  label: string
  shortLabel: string
  to: string
  roles?: UserRole[]
}

export const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    shortLabel: 'DB',
    to: '/dashboard',
  },
  {
    label: 'Accounts',
    shortLabel: 'AC',
    to: '/accounts',
    roles: ['customer'],
  },
  {
    label: 'Transactions',
    shortLabel: 'TX',
    to: '/transactions',
  },
  {
    label: 'Users',
    shortLabel: 'US',
    to: '/approvals',
    roles: ['employee'],
  },
]
