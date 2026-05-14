/**
 * Tests for lib/audit.ts — verifies the helper writes the expected row shape
 * and never throws (audit failures should be silent so the underlying action
 * can still complete).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { auditCreate } = vi.hoisted(() => ({ auditCreate: vi.fn() }))

vi.mock('@/lib/db', () => ({
  prisma: {
    auditLog: { create: auditCreate },
  },
}))

import { audit } from '@/lib/audit'

beforeEach(() => {
  auditCreate.mockReset()
})

describe('audit', () => {
  it('writes an audit row with the supplied fields', async () => {
    auditCreate.mockResolvedValue({ id: 'log-1' })
    await audit({
      actorId: 'user-1',
      action: 'user.create',
      entityType: 'User',
      entityId: 'user-2',
      details: { name: 'Alice' },
    })
    expect(auditCreate).toHaveBeenCalledWith({
      data: {
        actorId: 'user-1',
        action: 'user.create',
        entityType: 'User',
        entityId: 'user-2',
        details: { name: 'Alice' },
      },
    })
  })

  it('normalizes null actorId / null entity', async () => {
    auditCreate.mockResolvedValue({ id: 'log-2' })
    await audit({ action: 'hierarchy.resync' })
    expect(auditCreate).toHaveBeenCalledWith({
      data: {
        actorId: null,
        action: 'hierarchy.resync',
        entityType: null,
        entityId: null,
        details: undefined,
      },
    })
  })

  it('swallows database errors so the caller never sees them', async () => {
    auditCreate.mockRejectedValue(new Error('DB unreachable'))
    // Should NOT throw
    await expect(
      audit({ action: 'user.delete', entityId: 'x' }),
    ).resolves.toBeUndefined()
  })

  it('serializes details through JSON.stringify (deep-clones, drops functions)', async () => {
    auditCreate.mockResolvedValue({ id: 'log-3' })
    const detail = { a: 1, b: { c: 2 }, fn: () => 'will be stripped' } as Record<string, unknown>
    await audit({ action: 'user.update', details: detail })
    const data = auditCreate.mock.calls[0][0].data
    expect(data.details).toEqual({ a: 1, b: { c: 2 } })
    expect(data.details).not.toHaveProperty('fn')
  })
})
