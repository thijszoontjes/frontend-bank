import type { PageMetadata } from './common'

export interface ApprovalItem {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  bsn?: string
  createdAt?: string
}

export interface AccountConfigRequest {
  absoluteLimit: number
  dailyLimit: number
}

export interface ApprovalPayload {
  checkingAccount: AccountConfigRequest
  savingsAccount: AccountConfigRequest
}

export interface RejectApprovalPayload {
  reason?: string
}

export interface ApprovalListResult {
  items: ApprovalItem[]
  page: PageMetadata
}
