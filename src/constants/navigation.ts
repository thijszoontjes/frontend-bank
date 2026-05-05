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
    label: 'Approvals',
    shortLabel: 'AP',
    to: '/approvals',
    roles: ['employee'],
  },
  {
    label: 'Users',
    shortLabel: 'US',
    to: '/users',
    roles: ['employee'],
  },
  {
    label: 'New customer',
    shortLabel: 'NC',
    to: '/users/new',
    roles: ['employee'],
  },
]
