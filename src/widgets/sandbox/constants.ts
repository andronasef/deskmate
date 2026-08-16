/** Exact sandbox tokens (BYOW-03) — NEVER add allow-same-origin (PITFALLS Pitfall 1). */
export const SANDBOX_TOKENS = 'allow-scripts'

export const READY_TIMEOUT_MS = 3000

export const BRIDGE_TYPES = {
  READY: 'deskmate:ready',
  UPDATE: 'deskmate:update',
  API: 'deskmate:api',
} as const

export const NONCE_LENGTH = 32 // hex chars = 128 bits

/** Per-widget secret injected only via the srcdoc bootstrap (04-01-FINDINGS #4). */
export function generateNonce(): string {
  const bytes = new Uint8Array(NONCE_LENGTH / 2)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
