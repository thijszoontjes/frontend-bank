import type { HttpClient } from '@/services/api/httpClient'
import type { ApprovalService } from '@/services/contracts'
import type { ApprovalItem } from '@/types/approval'
import type { PageMetadata } from '@/types/common'
import { mapUser } from '@/services/http/user.mapper'
import type { BackendUserResponse } from '@/services/http/user.mapper'

interface PendingApprovalsResponse {
  items: Array<{
    user: BackendUserResponse
    reason: string
  }>
  page: PageMetadata
}

export function createHttpApprovalService(client: HttpClient): ApprovalService {
  return {
    async getPendingApprovals() {
      const response = await client.get<PendingApprovalsResponse>('/users/pending-approval')
      return response.items.map((item) => {
        const user = mapUser(item.user)

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          bsn: user.bsn,
          createdAt: user.createdAt,
          reason: item.reason,
        } satisfies ApprovalItem
      })
    },
    async approveApproval(userId, payload) {
      await client.post(`/users/${userId}/approval`, payload)
    },
    async rejectApproval(userId) {
      await client.post(`/users/${userId}/reject`)
    },
  }
}
