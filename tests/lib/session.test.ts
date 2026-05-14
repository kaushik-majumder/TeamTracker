/**
 * Tests for lib/session.ts encrypt/decrypt JWT round-trip.
 * Doesn't test the cookies helpers — those require Next.js's runtime.
 */
import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from '@/lib/session'
import { Role } from '@prisma/client'

describe('session encrypt/decrypt', () => {
  it('encrypts then decrypts a session payload round-trip', async () => {
    const payload = {
      userId: 'user-123',
      email: 'alice@example.com',
      name: 'Alice',
      role: 'MANAGER' as Role,
    }
    const token = await encrypt(payload)
    expect(typeof token).toBe('string')
    expect(token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/) // 3-segment JWT

    const decoded = await decrypt(token)
    expect(decoded).not.toBeNull()
    expect(decoded?.userId).toBe('user-123')
    expect(decoded?.email).toBe('alice@example.com')
    expect(decoded?.name).toBe('Alice')
    expect(decoded?.role).toBe('MANAGER')
  })

  it('returns null when the token is missing', async () => {
    expect(await decrypt(undefined)).toBeNull()
    expect(await decrypt('')).toBeNull()
  })

  it('returns null when the token is malformed', async () => {
    expect(await decrypt('this-is-not-a-jwt')).toBeNull()
  })

  it('returns null when the token signature is wrong', async () => {
    const token = await encrypt({
      userId: 'u',
      email: 'a@b.c',
      name: 'A',
      role: 'TEAM_LEAD' as Role,
    })
    // Tamper with the signature
    const parts = token.split('.')
    const tampered = `${parts[0]}.${parts[1]}.${'x'.repeat(parts[2].length)}`
    expect(await decrypt(tampered)).toBeNull()
  })
})
