import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'
import { ReviewForm } from './ReviewForm'

export default async function WorkflowsPage() {
  const session = await requireAuth()
  const isAdmin = session.role === 'ADMIN'

  // Admins see all workflows; everyone else is filtered by team access.
  const teamFilter = isAdmin
    ? {}
    : {
        teamId: {
          in: await prisma.teamAccess
            .findMany({ where: { userId: session.userId }, select: { teamId: true } })
            .then((rows) => rows.map((r) => r.teamId)),
        },
      }

  const [promotions, salaryHikes] = await Promise.all([
    prisma.promotionRequest.findMany({
      where: teamFilter,
      include: {
        employee: { select: { name: true } },
        team: { select: { name: true } },
        recommender: { select: { name: true } },
        reviewer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.salaryHikeRequest.findMany({
      where: teamFilter,
      include: {
        employee: { select: { name: true } },
        team: { select: { name: true } },
        recommender: { select: { name: true } },
        reviewer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const canReview = session.role === 'MANAGER' || session.role === 'ADMIN'

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
            {promotions.map((req) => (
              <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{req.employee.name}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm text-gray-500">{req.team.name}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {req.currentTitle} → <strong>{req.proposedTitle}</strong>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Recommended by {req.recommender.name} · {format(req.createdAt, 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600 mt-2 italic">"{req.justification}"</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(req.status)}`}>
                    {req.status}
                  </span>
                </div>

                {req.reviewNote && (
                  <p className="text-xs text-gray-500 mt-3 border-t border-gray-100 pt-2">
                    Review note: {req.reviewNote}
                    {req.reviewer && ` (${req.reviewer.name})`}
                  </p>
                )}

                {canReview && req.status === 'PENDING' && (
                  <ReviewForm requestId={req.id} type="promotion" />
                )}
              </div>
            ))}
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
            {salaryHikes.map((req) => (
              <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{req.employee.name}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm text-gray-500">{req.team.name}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      ${req.currentSalary.toLocaleString()} →{' '}
                      <strong>${req.proposedSalary.toLocaleString()}</strong>
                      <span className="text-gray-400 ml-1 text-xs">
                        (+{Math.round(((req.proposedSalary - req.currentSalary) / req.currentSalary) * 100)}%)
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Recommended by {req.recommender.name} · {format(req.createdAt, 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600 mt-2 italic">"{req.justification}"</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(req.status)}`}>
                    {req.status}
                  </span>
                </div>

                {req.reviewNote && (
                  <p className="text-xs text-gray-500 mt-3 border-t border-gray-100 pt-2">
                    Review note: {req.reviewNote}
                    {req.reviewer && ` (${req.reviewer.name})`}
                  </p>
                )}

                {canReview && req.status === 'PENDING' && (
                  <ReviewForm requestId={req.id} type="salary" />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
