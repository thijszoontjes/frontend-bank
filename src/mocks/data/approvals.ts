import type { ApprovalItem } from '@/types/approval'

export const mockApprovals: ApprovalItem[] = [
  {
    id: 'apr-001',
    requester: 'Acme Trading',
    type: 'High-value transfer',
    amount: 18500,
    currency: 'EUR',
    priority: 'high',
    status: 'pending',
    requestedAt: '2026-04-15T07:15:00Z',
    reason: 'Transfer exceeds internal threshold and requires employee review.',
  },
  {
    id: 'apr-002',
    requester: 'Lena de Vries',
    type: 'New beneficiary',
    amount: 0,
    currency: 'EUR',
    priority: 'medium',
    status: 'pending',
    requestedAt: '2026-04-14T15:40:00Z',
    reason: 'Beneficiary registration is pending KYC confirmation.',
  },
  {
    id: 'apr-003',
    requester: 'Blue Harbor Holding',
    type: 'Business account unlock',
    amount: 0,
    currency: 'EUR',
    priority: 'low',
    status: 'pending',
    requestedAt: '2026-04-14T11:25:00Z',
    reason: 'Documentation has been uploaded and is ready for final approval.',
  },
]
