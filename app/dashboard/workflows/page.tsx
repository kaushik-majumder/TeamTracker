import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'
import { ReviewForm } from './ReviewForm'
import { approverRoleFor } from '@/lib/hierarchy'
import { Role } from '@prisma/client'

export default async function WorkflowsPage() {
  const session = await requireAuth()
  const isAdmin = session.role === 'ADMIN'

  // Build map: teamId → viewer's role on that team (for review qualification)
  const myAccess = await prisma.teamAccess.findMany({
    where: { userId: session.userId },
    select: { teamId: true, role: true },
  })
  const myTeamRole = new Map(myAccess.map((a) => [a.teamId, a.role]))

  const teamFilter = isAdmin
    ? {}
    : {
        teamId: {
          in: myAccess.map((a) => a.teamId),
        },
      }

  const [promotions, salaryHikes] = await Promise.all([
    prisma.promotionRequest.findMany({
      where: teamFilter,
      include: {
        employee: { select: { name: true } },
        subjectUser: { select: { name: true } },
        team: { select: { name: true } },
        recommender: { select: { id: true, name: true } },
        reviewer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.salaryHikeRequest.findMany({
      where: teamFilter,
      include: {
        employee: { select: { name: true } },
        subjectUser: { select: { name: true } },
        team: { select: { name: true } },
        recommender: { select: { id: true, name: true } },
        reviewer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Helper: can the viewer review THIS specific request?
  const recommenderIds = [
    ...new Set([...promotions, ...salaryHikes].map((r) => r.recommendedBy)),
  ]
  const [recommenderAccess, recommenderSupervisors] = await Promise.all([
    prisma.teamAccess.findMany({
      where: { userId: { in: recommenderIds } },
      select: { userId: true, teamId: true, role: true },
    }),
    prisma.user.findMany({
      where: { id: { in: recommenderIds } },
      select: { id: true, reportsToId: true },
    }),
  ])
  const recRoleKey = (userId: string, teamId: string) => `${userId}|${teamId}`
  const recRoleMap = new Map(recommenderAccess.map((r) => [recRoleKey(r.userId, r.teamId), r.role]))
  const supervisorByRecommender = new Map(recommenderSupervisors.map((u) => [u.id, u.reportsToId]))

  function canReviewThis(opts: { recommenderId: string; teamId: string }): boolean {
    if (isAdmin) return true
    // Direct supervisor of the recommender can review.
    if (supervisorByRecommender.get(opts.recommenderId) === session.userId) return true
    // Otherwise fall back to role-on-team check.
    const viewerRole = myTeamRole.get(opts.teamId)
    if (!viewerRole) return false
    const recRole = recRoleMap.get(recRoleKey(opts.recommenderId, opts.teamId)) as Role | undefined
    if (!recRole) return false
    return approverRoleFor(recRole).includes(viewerRole)
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
    }
    return map[status] ?? 'bg-gray-100 text-gray-600'
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Workflows</h1>

      {/* Promotions */}
      <section className="mb-8">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
          Promotion Requests
        </h2>
        {promotions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-400">
            No promotion requests yet.
          </div>
        ) : (
          <div className="space-y-3">
            {promotions.map((req) => {
              const subjectName = req.employee?.name ?? req.subjectUser?.name ?? 'Unknown'
              const subjectKind = req.subjectUserId ? 'leader' : 'member'
              const showReview = req.status === 'PENDING' && canReviewThis({
                recommenderId: req.recommendedBy,
                teamId: req.teamId,
              })
              const isMine = req.recommendedBy === session.userId

              return (
                <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{subjectName}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {subjectKind === 'leader' ? 'Leadership' : 'Team Member'}
                        </span>
                        <span className="text-gray-400">·</span>
                        <span className="text-sm text-gray-500">{req.team.name}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {req.currentTitle} → <strong>{req.proposedTitle}</strong>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Recommended by {isMine ? 'you' : req.recommender.name} · {format(req.createdAt, 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600 mt-2 italic">&quot;{req.justification}&quot;</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </div>

                  {req.reviewNote && (
                    <p className="text-xs text-gray-500 mt-3 border-t border-gray-100 pt-2">
                      Review note: {req.reviewNote}
                      {req.reviewer && ` (${req.reviewer.name})`}
                    </p>
                  )}

                  {showReview && <ReviewForm requestId={req.id} type="promotion" />}
                  {req.status === 'PENDING' && !showReview && isMine && (
                    <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-2">
                      Waiting for review by higher leadership.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Salary Hikes */}
      <section>
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
          Salary Hike Requests
        </h2>
        {salaryHikes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-400">
            No salary hike requests yet.
          </div>
        ) : (
          <div className="space-y-3">
            {salaryHikes.map((req) => {
              const subjectName = req.employee?.name ?? req.subjectUser?.name ?? 'Unknown'
              const subjectKind = req.subjectUserId ? 'leader' : 'member'
              const pct = Math.round(((req.proposedSalary - req.currentSalary) / req.currentSalary) * 100)
              const showReview = req.status === 'PENDING' && canReviewThis({
                recommenderId: req.recommendedBy,
                teamId: req.teamId,
              })
              const isMine = req.recommendedBy === session.userId

              return (
                <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{subjectName}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {subjectKind === 'leader' ? 'Leadership' : 'Team Member'}
                        </span>
                        <span className="text-gray-400">·</span>
                        <span className="text-sm text-gray-500">{req.team.name}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        ${req.currentSalary.toLocaleString()} →{' '}
                        <strong>${req.proposedSalary.toLocaleString()}</strong>
                        <span className="text-gray-400 ml-1 text-xs">(+{pct}%)</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Recommended by {isMine ? 'you' : req.recommender.name} · {format(req.createdAt, 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600 mt-2 italic">&quot;{req.justification}&quot;</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </div>

                  {req.reviewNote && (
                    <p className="text-xs text-gray-500 mt-3 border-t border-gray-100 pt-2">
                      Review note: {req.reviewNote}
                      {req.reviewer && ` (${req.reviewer.name})`}
                    </p>
                  )}

                  {showReview && <ReviewForm requestId={req.id} type="salary" />}
                  {req.status === 'PENDING' && !showReview && isMine && (
                    <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-2">
                      Waiting for review by higher leadership.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
