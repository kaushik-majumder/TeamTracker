/**
 * Global test setup. Runs once before any test file is loaded.
 *
 * Sets dummy env vars so that modules that read process.env at import time
 * (Prisma client init, session secret) don't blow up. Tests that actually
 * hit the DB are out-of-scope here — for those, run them against a real
 * test database with a proper DATABASE_URL.
 */
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.DIRECT_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.SESSION_SECRET ??= 'test-secret-do-not-use-in-production-1234567890abcdef'
process.env.CRON_SECRET ??= 'test-cron-secret'

// 'server-only' throws when imported from anything except the server. Vitest
// runs in Node so we'd technically pass, but the package's check is strict
// about the framework context. Stub it out for tests.
import { vi } from 'vitest'
vi.mock('server-only', () => ({}))
