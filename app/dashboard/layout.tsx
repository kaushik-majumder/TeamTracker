import { requireAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { prisma } from '@/lib/db'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()
  const isAdmin = session.role === 'ADMIN'

  const teamIds = isAdmin
    ? (await prisma.team.findMany({ select: { id: true } })).map((t) => t.id)
    : (
        await prisma.teamAccess.findMany({
          where: { userId: session.userId },
          select: { teamId: true },
        })
      ).map((r) => r.teamId)

  const [pendingPromos, pendingSalary, unreadNotifs] = await Promise.all([
    prisma.promotionRequest.count({ where: { teamId: { in: teamIds }, status: 'PENDING' } }),
    prisma.salaryHikeRequest.count({ where: { teamId: { in: teamIds }, status: 'PENDING' } }),
    prisma.notification.count({ where: { userId: session.userId, readAt: null } }),
  ])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        name={session.name}
        role={session.role}
        pendingWorkflows={pendingPromos + pendingSalary}
        unreadNotifications={unreadNotifs}
      />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
