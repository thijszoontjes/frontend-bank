export function formatCurrency(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCompactCurrency(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}
