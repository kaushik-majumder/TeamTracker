import { prisma } from '@/lib/db'

export async function GET() {
  const checks: Record<string, unknown> = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    hasSessionSecret: !!process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV,
  }

  // Try a trivial Prisma query to verify the runtime + DB connection
  try {
    const userCount = await prisma.user.count()
    checks.dbConnected = true
    checks.userCount = userCount
  } catch (err) {
    checks.dbConnected = false
    checks.dbError = (err as Error).message
    checks.dbStack = (err as Error).stack
  }

  return Response.json(checks, { status: 200 })
}
