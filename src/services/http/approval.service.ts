import type { HttpClient } from '@/services/api/httpClient'
import type { ApprovalService } from '@/services/contracts'
import type { ApprovalItem } from '@/types/approval'
import type { PageMetadata } from '@/types/common'
import { mapUser } from '@/services/http/user.mapper'
import type { BackendUserResponse } from '@/services/http/user.mapper'

interface PendingApprovalsResponse {
  items: BackendUserResponse[]
  page: PageMetadata
}

export function createHttpApprovalService(client: HttpClient): ApprovalService {
  return {
    async getPendingApprovals(page = 0, size = 20) {
      const response = await client.get<PendingApprovalsResponse>(
        `/users?role=CUSTOMER&approvalStatus=pending&page=${page}&size=${size}`,
      )

      return {
        items: response.items.map((pendingUser) => {
          const user = mapUser(pendingUser)

          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            bsn: user.bsn,
            createdAt: user.createdAt,
          } satisfies ApprovalItem
        }),
        page: response.page,
      }
    },
    async approveApproval(userId, payload) {
      await client.put(`/users/${userId}/approval`, payload)
    },
    async rejectApproval(userId, reason) {
      await client.put(`/users/${userId}/reject`, reason ? { reason } : undefined)
    },
  }
}
