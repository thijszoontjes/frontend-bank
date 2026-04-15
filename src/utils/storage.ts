export function readStorage<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeStorage<T>(key: string, value: T | null) {
  if (value === null) {
    window.localStorage.removeItem(key)
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}
