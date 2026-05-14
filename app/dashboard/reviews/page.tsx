import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'
import { ReviewCard } from './ReviewCard'

export default async function ReviewsPage() {
  const session = await requireAuth()

  const reviews = await prisma.cycleReview.findMany({
    where: { reviewerId: session.userId },
    include: {
      employee: { select: { id: true, name: true, title: true, team: { select: { name: true } } } },
      cycle: { select: { id: true, name: true, endDate: true, status: true } },
    },
    orderBy: [{ status: 'asc' }, { cycle: { endDate: 'asc' } }],
  })

  const pending = reviews.filter((r) => r.cycle.status === 'OPEN' && r.status !== 'COMPLETED')
  const completed = reviews.filter((r) => r.status === 'COMPLETED')
  const closed = reviews.filter((r) => r.cycle.status === 'CLOSED' && r.status !== 'COMPLETED')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">Performance reviews assigned to you.</p>
      </div>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Pending · {pending.length}
          </h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <ReviewCard
                key={r.id}
                id={r.id}
                employeeName={r.employee.name}
                employeeTitle={r.employee.title}
                teamName={r.employee.team.name}
                cycleName={r.cycle.name}
                cycleDueDate={format(r.cycle.endDate, 'MMM d, yyyy')}
                status={r.status}
                rating={r.rating}
                strengths={r.strengths}
                improvements={r.improvements}
                goals={r.goals}
                canEdit
              />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Completed · {completed.length}
          </h2>
          <div className="space-y-3">
            {completed.map((r) => (
              <ReviewCard
                key={r.id}
                id={r.id}
                employeeName={r.employee.name}
                employeeTitle={r.employee.title}
                teamName={r.employee.team.name}
                cycleName={r.cycle.name}
                cycleDueDate={format(r.cycle.endDate, 'MMM d, yyyy')}
                status={r.status}
                rating={r.rating}
                strengths={r.strengths}
                improvements={r.improvements}
                goals={r.goals}
                canEdit={false}
              />
            ))}
          </div>
        </section>
      )}

      {closed.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Past Cycles · {closed.length}
          </h2>
          <div className="space-y-3">
            {closed.map((r) => (
              <ReviewCard
                key={r.id}
                id={r.id}
                employeeName={r.employee.name}
                employeeTitle={r.employee.title}
                teamName={r.employee.team.name}
                cycleName={r.cycle.name}
                cycleDueDate={format(r.cycle.endDate, 'MMM d, yyyy')}
                status={r.status}
                rating={r.rating}
                strengths={r.strengths}
                improvements={r.improvements}
                goals={r.goals}
                canEdit={false}
              />
            ))}
          </div>
        </section>
      )}

      {reviews.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">
          You have no reviews assigned. When an admin opens a review cycle that includes your team,
          your pending reviews will appear here.
        </div>
      )}
    </div>
  )
}
