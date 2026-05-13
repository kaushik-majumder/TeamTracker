import 'server-only'
import { promises as dns } from 'dns'

// Domains commonly used as placeholders. Reject so we don't fill the DB with junk.
const PLACEHOLDER_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'sample.com',
  'localhost',
  'company.com',
])

/**
 * Verifies an email is plausibly real:
 *   1. Domain isn't a known placeholder.
 *   2. Domain has MX records (a real mail server is configured).
 *
 * Returns an error message string, or null if valid.
 * We never claim to verify a specific mailbox exists — only that the
 * domain can receive mail.
 */
export async function validateEmailDomain(email: string): Promise<string | null> {
  const at = email.lastIndexOf('@')
  if (at === -1) return 'Invalid email address'

  const domain = email.slice(at + 1).toLowerCase().trim()

  if (PLACEHOLDER_DOMAINS.has(domain)) {
    return 'Please use a real email address'
  }

  try {
    const mx = await dns.resolveMx(domain)
    // RFC 7505: a single MX with priority 0 and empty exchange is a "null MX"
    // meaning the domain explicitly does not accept mail.
    const usable = mx.filter((r) => r.exchange && r.exchange.length > 0)
    if (usable.length === 0) return `${domain} does not accept email`
    return null
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    // Hard fails: domain doesn't exist / has no records / DNS rejects it.
    if (code === 'ENOTFOUND' || code === 'ENODATA' || code === 'ESERVFAIL' || code === 'EREFUSED') {
      return `${domain} is not a valid email domain`
    }
    // Transient network errors — fail open so legit users aren't blocked.
    console.warn(`[email-validation] DNS check failed for ${domain}:`, code ?? err)
    return null
  }
}
