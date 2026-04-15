import { mockAccounts } from '@/mocks/data/accounts'
import { mockApprovals } from '@/mocks/data/approvals'
import { mockTransactions } from '@/mocks/data/transactions'
import { mockUsers } from '@/mocks/data/users'

function cloneDataset<T>(dataset: T): T {
  return structuredClone(dataset)
}

export const mockDb = {
  users: cloneDataset(mockUsers),
  accounts: cloneDataset(mockAccounts),
  transactions: cloneDataset(mockTransactions),
  approvals: cloneDataset(mockApprovals),
}
