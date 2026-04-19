import type { UserProfile } from '@/types/user'

export interface MockUserRecord extends UserProfile {
  password: string
}

export const mockUsers: MockUserRecord[] = [
  {
    id: 'user-customer-approved',
    firstName: 'Lena',
    lastName: 'de Vries',
    email: 'customer@bank.dev',
    password: 'password123',
    role: 'customer',
    approvalStatus: 'approved',
    approved: true,
    initials: 'LV',
    phoneNumber: '+31612345678',
    bsn: '***6789',
    createdAt: '2026-04-12T09:00:00Z',
  },
  {
    id: 'user-customer-pending',
    firstName: 'Sam',
    lastName: 'Bakker',
    email: 'pending@bank.dev',
    password: 'password123',
    role: 'customer',
    approvalStatus: 'pending',
    approved: false,
    initials: 'SB',
    phoneNumber: '+31687654321',
    bsn: '***4321',
    createdAt: '2026-04-18T14:20:00Z',
  },
  {
    id: 'user-employee-001',
    firstName: 'Milan',
    lastName: 'Jansen',
    email: 'employee@bank.dev',
    password: 'password123',
    role: 'employee',
    approvalStatus: 'approved',
    approved: true,
    initials: 'MJ',
    phoneNumber: '+31611112222',
    bsn: '***2333',
    createdAt: '2026-04-10T08:15:00Z',
  },
]
