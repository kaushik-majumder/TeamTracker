import { prisma } from '@/lib/db'
import Link from 'next/link'
import { format } from 'date-fns'
import { CreateCycleForm } from './CreateCycleForm'

export default async function AdminCyclesPage() {
  const [cycles, teams] = await Promise.all([
    prisma.reviewCycle.findMany({
      include: {
        _count: { select: { reviews: true } },
        teams: { include: { team: { select: { name: true } } } },
        reviews: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  const statusColor = {
    DRAFT: 'bg-gray-100 text-gray-700',
    OPEN: 'bg-blue-100 text-blue-700',
    CLOSED: 'bg-green-100 text-green-700',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Review Cycles</h1>
        <p className="text-sm text-gray-500 mt-1">
          Run structured performance reviews on a schedule. Create a cycle, open it to assign reviews,
          and close it when done.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {cycles.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
              No review cycles yet. Create your first one →
            </div>
          ) : (
            cycles.map((c) => {
              const completed = c.reviews.filter((r) => r.status === 'COMPLETED').length
              const scope = c.teams.length === 0 ? 'All teams' : c.teams.map((t) => t.team.name).join(', ')
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/admin/review-cycles/${c.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-5 block hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{c.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[c.status]}`}>{c.status}</span>
                      </div>
                      {c.description && <p className="text-sm text-gray-500 mt-1">{c.description}</p>}
                      <p className="text-xs text-gray-400 mt-2">
                        {format(c.startDate, 'MMM d')} – {format(c.endDate, 'MMM d, yyyy')} · {scope}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-gray-700">
                        {completed} / {c._count.reviews}
                      </p>
                      <p className="text-xs text-gray-400">completed</p>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-8">
            <h2 className="font-semibold text-gray-900 mb-3">New Cycle</h2>
            <CreateCycleForm teams={teams} />
          </div>
        </div>
      </div>
    </div>
  )
}
