import { requireAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { prisma } from '@/lib/db'
import { approverRoleFor } from '@/lib/hierarchy'
import { Role } from '@prisma/client'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()
  const isAdmin = session.role === 'ADMIN'

  // For admins: count all PENDING workflows.
  // For others: count requests this user is qualified to review.
  let pendingReviewable = 0

  if (isAdmin) {
    const [p, s] = await Promise.all([
      prisma.promotionRequest.count({ where: { status: 'PENDING' } }),
      prisma.salaryHikeRequest.count({ where: { status: 'PENDING' } }),
    ])
    pendingReviewable = p + s
  } else {
    const myAccess = await prisma.teamAccess.findMany({
      where: { userId: session.userId },
      select: { teamId: true, role: true },
    })
    const teamIds = myAccess.map((a) => a.teamId)
    const viewerRoleByTeam = new Map(myAccess.map((a) => [a.teamId, a.role]))

    // Pull pending requests on viewer's teams + recommender access on same team
    const [promos, salaries] = await Promise.all([
      prisma.promotionRequest.findMany({
        where: { status: 'PENDING', teamId: { in: teamIds } },
        select: { teamId: true, recommendedBy: true },
      }),
      prisma.salaryHikeRequest.findMany({
        where: { status: 'PENDING', teamId: { in: teamIds } },
        select: { teamId: true, recommendedBy: true },
      }),
    ])
    const all = [...promos, ...salaries]
    if (all.length > 0) {
      const recIds = [
        ...new Set(
          all
            .map((r) => r.recommendedBy)
            .filter((id): id is string => id !== null)
        ),
      ]
      const [recAccess, recSupervisors] = await Promise.all([
        prisma.teamAccess.findMany({
          where: { userId: { in: recIds } },
          select: { userId: true, teamId: true, role: true },
        }),
        prisma.user.findMany({
          where: { id: { in: recIds } },
          select: { id: true, reportsToId: true },
        }),
      ])
      const recKey = (uid: string, tid: string) => `${uid}|${tid}`
      const recRoleMap = new Map(recAccess.map((r) => [recKey(r.userId, r.teamId), r.role]))
      const supervisorOf = new Map(recSupervisors.map((u) => [u.id, u.reportsToId]))

      pendingReviewable = all.filter((r) => {
        if (!r.recommendedBy) return false
        if (supervisorOf.get(r.recommendedBy) === session.userId) return true
        const viewerRole = viewerRoleByTeam.get(r.teamId) as Role | undefined
        const recRole = recRoleMap.get(recKey(r.recommendedBy, r.teamId)) as Role | undefined
        if (!viewerRole || !recRole) return false
        return approverRoleFor(recRole).includes(viewerRole)
      }).length
    }
  }

  const [unreadNotifs, userProfile, pendingReviews] = await Promise.all([
    prisma.notification.count({
      where: { userId: session.userId, readAt: null },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { profileImageUrl: true },
    }),
    prisma.cycleReview.count({
      where: {
        reviewerId: session.userId,
        status: { not: 'COMPLETED' },
        cycle: { status: 'OPEN' },
      },
    }),
  ])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        name={session.name}
        role={session.role}
        pendingWorkflows={pendingReviewable}
        unreadNotifications={unreadNotifs}
        pendingReviews={pendingReviews}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopBar name={session.name} email={session.email} imageUrl={userProfile?.profileImageUrl} />
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-8 py-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
