export async function simulateDelay(duration = 250) {
  await new Promise((resolve) => window.setTimeout(resolve, duration))
}

export function createToken() {
  return `mock-token-${Math.random().toString(36).slice(2, 10)}`
}
