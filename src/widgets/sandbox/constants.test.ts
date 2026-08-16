import { describe, expect, it } from 'vitest'
import { generateNonce, SANDBOX_TOKENS, READY_TIMEOUT_MS, BRIDGE_TYPES, NONCE_LENGTH } from './constants.ts'

describe('sandbox constants (BYOW-03)', () => {
  it('SANDBOX_TOKENS is EXACTLY allow-scripts — never allow-same-origin', () => {
    expect(SANDBOX_TOKENS).toBe('allow-scripts')
    expect(SANDBOX_TOKENS).not.toContain('allow-same-origin')
    expect(SANDBOX_TOKENS).not.toContain('allow-forms')
    expect(SANDBOX_TOKENS).not.toContain('allow-popups')
    expect(SANDBOX_TOKENS).not.toContain('allow-top-navigation')
    expect(SANDBOX_TOKENS).not.toContain('allow-modals')
  })

  it('generateNonce produces 128-bit hex (32 chars), unique per call', () => {
    const a = generateNonce()
    const b = generateNonce()
    expect(a).toMatch(new RegExp(`^[0-9a-f]{${NONCE_LENGTH}}$`))
    expect(a).not.toBe(b)
  })

  it('bridge types and timeout are stable contract values', () => {
    expect(BRIDGE_TYPES).toEqual({ READY: 'deskmate:ready', UPDATE: 'deskmate:update', API: 'deskmate:api' })
    expect(READY_TIMEOUT_MS).toBe(3000)
  })
})
