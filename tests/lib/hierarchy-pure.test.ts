/**
 * Pure-logic tests for lib/hierarchy.ts — no DB calls.
 *
 * We import the helpers indirectly because lib/hierarchy.ts also exports
 * functions that touch Prisma. The pure helpers (levelOf, approverRoleFor,
 * canRecommendRoles) don't, so we redefine them here as a snapshot to keep
 * the test runner independent of prisma at import time.
 *
 * If you change ROLE_LEVEL or the approver/recommend tables in
 * lib/hierarchy.ts, update this file too.
 */
import { describe, it, expect } from 'vitest'
import { Role } from '@prisma/client'
import { levelOf, approverRoleFor, canRecommendRoles } from '@/lib/hierarchy'

describe('levelOf', () => {
  it('orders roles correctly: ADMIN > MD > MANAGER > TEAM_LEAD', () => {
    expect(levelOf('ADMIN')).toBeGreaterThan(levelOf('MANAGING_DIRECTOR'))
    expect(levelOf('MANAGING_DIRECTOR')).toBeGreaterThan(levelOf('MANAGER'))
    expect(levelOf('MANAGER')).toBeGreaterThan(levelOf('TEAM_LEAD'))
  })

  it('returns numeric weight for every role', () => {
    for (const role of ['ADMIN', 'MANAGING_DIRECTOR', 'MANAGER', 'TEAM_LEAD'] as Role[]) {
      expect(typeof levelOf(role)).toBe('number')
    }
  })
})

describe('approverRoleFor', () => {
  it('TEAM_LEAD requests are approved by MANAGER', () => {
    expect(approverRoleFor('TEAM_LEAD')).toEqual(['MANAGER'])
  })

  it('MANAGER requests are approved by MANAGING_DIRECTOR', () => {
    expect(approverRoleFor('MANAGER')).toEqual(['MANAGING_DIRECTOR'])
  })

  it('MANAGING_DIRECTOR requests are approved by ADMIN', () => {
    expect(approverRoleFor('MANAGING_DIRECTOR')).toEqual(['ADMIN'])
  })

  it('ADMIN does not need approval (no approver)', () => {
    expect(approverRoleFor('ADMIN')).toEqual([])
  })

  it('skip-level approval is not allowed: a TEAM_LEAD request cannot be approved by an MD', () => {
    expect(approverRoleFor('TEAM_LEAD')).not.toContain('MANAGING_DIRECTOR')
  })
})

describe('canRecommendRoles', () => {
  it('TEAM_LEAD cannot recommend any login-user role (only employees)', () => {
    expect(canRecommendRoles('TEAM_LEAD')).toEqual([])
  })

  it('MANAGER can recommend TEAM_LEAD', () => {
    expect(canRecommendRoles('MANAGER')).toContain('TEAM_LEAD')
    expect(canRecommendRoles('MANAGER')).not.toContain('MANAGER')
  })

  it('MANAGING_DIRECTOR can recommend both TEAM_LEAD and MANAGER', () => {
    const allowed = canRecommendRoles('MANAGING_DIRECTOR')
    expect(allowed).toContain('TEAM_LEAD')
    expect(allowed).toContain('MANAGER')
    expect(allowed).not.toContain('MANAGING_DIRECTOR')
    expect(allowed).not.toContain('ADMIN')
  })

  it('ADMIN can recommend anyone below admin', () => {
    const allowed = canRecommendRoles('ADMIN')
    expect(allowed).toContain('TEAM_LEAD')
    expect(allowed).toContain('MANAGER')
    expect(allowed).toContain('MANAGING_DIRECTOR')
    expect(allowed).not.toContain('ADMIN')
  })
})
