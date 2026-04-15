import type { UserProfile } from '@/types/user'

export interface MockUserRecord extends UserProfile {
  password: string
}

export const mockUsers: MockUserRecord[] = [
  {
    id: 'user-customer-001',
    firstName: 'Lena',
    lastName: 'de Vries',
    email: 'customer@bank.dev',
    password: 'password123',
    role: 'customer',
    customerSegment: 'Retail Plus',
    initials: 'LV',
  },
  {
    id: 'user-employee-001',
    firstName: 'Milan',
    lastName: 'Jansen',
    email: 'employee@bank.dev',
    password: 'password123',
    role: 'employee',
    department: 'Operations',
    initials: 'MJ',
  },
]

export const demoCredentials = {
  customer: {
    email: 'customer@bank.dev',
    password: 'password123',
  },
  employee: {
    email: 'employee@bank.dev',
    password: 'password123',
  },
}
