import { prisma } from '@/lib/db'

export async function GET() {
  const checks: Record<string, unknown> = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    hasSessionSecret: !!process.env.SESSION_SECRET,
    hasCronSecret: !!process.env.CRON_SECRET,
    smtpConfigured: !!process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.example.com',
    nodeEnv: process.env.NODE_ENV,
  }

  try {
    const userCount = await prisma.user.count()
    checks.dbConnected = true
    checks.userCount = userCount
  } catch (err) {
    // Don't leak DB host / stack info — just the error class name.
    checks.dbConnected = false
    checks.dbErrorKind = (err as Error).constructor.name
  }

  return Response.json(checks, { status: 200 })
}
