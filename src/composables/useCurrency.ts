import { formatCompactCurrency, formatCurrency } from '@/utils/format'

export function useCurrency() {
  return {
    formatCompactCurrency,
    formatCurrency,
  }
}
