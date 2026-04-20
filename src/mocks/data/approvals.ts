import type { ApprovalItem } from '@/types/approval'

export const mockApprovals: ApprovalItem[] = [
  {
    id: 'user-customer-pending',
    firstName: 'Sam',
    lastName: 'Bakker',
    email: 'pending@bank.dev',
    phoneNumber: '+31687654321',
    bsn: '***4321',
    createdAt: '2026-04-18T14:20:00Z',
    reason: 'Waiting for employee approval',
  },
]
