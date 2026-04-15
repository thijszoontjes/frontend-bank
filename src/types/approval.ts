export type ApprovalPriority = 'low' | 'medium' | 'high'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface ApprovalItem {
  id: string
  requester: string
  type: string
  amount: number
  currency: string
  priority: ApprovalPriority
  status: ApprovalStatus
  requestedAt: string
  reason: string
}
