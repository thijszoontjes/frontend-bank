import type { HttpClient } from '@/services/api/httpClient'
import type { ApprovalService } from '@/services/contracts'

export function createHttpApprovalService(client: HttpClient): ApprovalService {
  return {
    getPendingApprovals: () => client.get('/approvals/pending'),
    approveApproval: (id) => client.patch(`/approvals/${id}/approve`),
    rejectApproval: (id) => client.patch(`/approvals/${id}/reject`),
  }
}
