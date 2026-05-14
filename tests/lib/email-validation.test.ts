/**
 * Tests for lib/email-validation.ts — exercises the placeholder-domain
 * blocklist and various MX-resolution outcomes. DNS is mocked so the tests
 * don't hit the network.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock node:dns's promises API before importing the module under test.
vi.mock('dns', () => {
  return {
    promises: {
      resolveMx: vi.fn(),
    },
  }
})

import { promises as dns } from 'dns'
import { validateEmailDomain } from '@/lib/email-validation'

const resolveMxMock = dns.resolveMx as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  resolveMxMock.mockReset()
})

describe('validateEmailDomain', () => {
  it('returns null for a valid email with usable MX records', async () => {
    resolveMxMock.mockResolvedValue([{ exchange: 'mx.google.com', priority: 10 }])
    expect(await validateEmailDomain('alice@gmail.com')).toBeNull()
  })

  it('rejects placeholder domains without doing a DNS lookup', async () => {
    expect(await validateEmailDomain('bob@example.com')).toMatch(/real email/i)
    expect(await validateEmailDomain('bob@test.com')).toMatch(/real email/i)
    expect(await validateEmailDomain('bob@localhost')).toMatch(/real email/i)
    expect(resolveMxMock).not.toHaveBeenCalled()
  })

  it('rejects emails without an @ sign', async () => {
    expect(await validateEmailDomain('not-an-email')).toMatch(/invalid/i)
  })

  it('rejects ENOTFOUND (domain does not exist)', async () => {
    const err = Object.assign(new Error('not found'), { code: 'ENOTFOUND' })
    resolveMxMock.mockRejectedValue(err)
    expect(await validateEmailDomain('bob@nonexistent-asdf-1234.example')).toMatch(/not a valid email domain/i)
  })

  it('rejects ESERVFAIL (typoed / broken domains)', async () => {
    const err = Object.assign(new Error('serv fail'), { code: 'ESERVFAIL' })
    resolveMxMock.mockRejectedValue(err)
    expect(await validateEmailDomain('bob@gmial.com')).toMatch(/not a valid email domain/i)
  })

  it('rejects null MX records (RFC 7505)', async () => {
    resolveMxMock.mockResolvedValue([{ exchange: '', priority: 0 }])
    expect(await validateEmailDomain('bob@no-mail.example')).toMatch(/does not accept email/i)
  })

  it('fails open on transient DNS errors (timeouts, network blips)', async () => {
    const err = Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })
    resolveMxMock.mockRejectedValue(err)
    // Lenient policy: we let the user through so a flaky resolver doesn't
    // block a legitimate signup.
    expect(await validateEmailDomain('bob@flaky.example')).toBeNull()
  })

  it('normalizes domain casing', async () => {
    resolveMxMock.mockResolvedValue([{ exchange: 'mx.google.com', priority: 10 }])
    expect(await validateEmailDomain('Bob@Gmail.COM')).toBeNull()
  })
})
