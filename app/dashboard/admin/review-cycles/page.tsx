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
    DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200',
    OPEN: 'bg-blue-100 text-blue-700',
    CLOSED: 'bg-green-100 text-green-700',
  }

  const cardTheme = {
    DRAFT: 'border-l-4 border-l-gray-300 bg-white dark:bg-gray-900',
    OPEN: 'border-l-4 border-l-blue-400 bg-gradient-to-r from-blue-50/40 to-white dark:from-blue-950/30 dark:to-gray-900',
    CLOSED: 'border-l-4 border-l-emerald-400 bg-gradient-to-r from-emerald-50/40 to-white dark:from-emerald-950/30 dark:to-gray-900',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Review Cycles</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
          Run structured performance reviews on a schedule. Create a cycle, open it to assign reviews,
          and close it when done.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {cycles.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-400 dark:text-gray-400">
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
                  className={`rounded-xl border border-gray-200 dark:border-gray-800 p-5 block transition-all hover:shadow-md hover:-translate-y-0.5 ${cardTheme[c.status]}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{c.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[c.status]}`}>{c.status}</span>
                      </div>
                      {c.description && <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{c.description}</p>}
                      <p className="text-xs text-gray-400 dark:text-gray-400 mt-2">
                        {format(c.startDate, 'MMM d')} – {format(c.endDate, 'MMM d, yyyy')} · {scope}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {completed} / {c._count.reviews}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-400">completed</p>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        <div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 sticky top-8">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">New Cycle</h2>
            <CreateCycleForm teams={teams} />
          </div>
        </div>
      </div>
    </div>
  )
}
