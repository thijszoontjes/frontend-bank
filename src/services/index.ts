import { createHttpClient } from '@/services/api/httpClient'
import type { ServiceRegistry } from '@/services/contracts'

import { appConfig } from './config'
import { createHttpAccountService } from './http/account.service'
import { createHttpApprovalService } from './http/approval.service'
import { createHttpAuthService } from './http/auth.service'
import { createHttpTransactionService } from './http/transaction.service'
import { createHttpUserManagementService } from './http/user.service'
import { createMockAccountService } from './mock/account.service'
import { createMockApprovalService } from './mock/approval.service'
import { createMockAuthService } from './mock/auth.service'
import { createMockTransactionService } from './mock/transaction.service'
import { createMockUserManagementService } from './mock/user.service'

const httpClient = createHttpClient(appConfig.apiBaseUrl)

const liveServices: ServiceRegistry = {
  auth: createHttpAuthService(httpClient),
  account: createHttpAccountService(httpClient),
  transaction: createHttpTransactionService(httpClient),
  approval: createHttpApprovalService(httpClient),
  user: createHttpUserManagementService(httpClient),
}

const mockServices: ServiceRegistry = {
  auth: createMockAuthService(),
  account: createMockAccountService(),
  transaction: createMockTransactionService(),
  approval: createMockApprovalService(),
  user: createMockUserManagementService(),
}

export const services = appConfig.apiMode === 'live' ? liveServices : mockServices
