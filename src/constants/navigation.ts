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
  },
  {
    label: 'Transactions',
    shortLabel: 'TX',
    to: '/transactions',
  },
  {
    label: 'Pending approvals',
    shortLabel: 'PA',
    to: '/approvals',
    roles: ['employee'],
  },
]
