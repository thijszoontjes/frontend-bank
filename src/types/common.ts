export type UserRole = 'customer' | 'employee'
export type ApiMode = 'mock' | 'live'

export interface PageMetadata {
  page: number
  size: number
  totalElements: number
  totalPages: number
}
