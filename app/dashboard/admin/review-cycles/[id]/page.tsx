import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { CycleActions } from './CycleActions'

export default async function CycleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id },
    include: {
      teams: { include: { team: { select: { name: true } } } },
      reviews: {
        include: {
          employee: { select: { name: true, title: true, team: { select: { name: true } } } },
          reviewer: { select: { name: true } },
        },
        orderBy: [{ status: 'asc' }, { employee: { name: 'asc' } }],
      },
    },
  })
  if (!cycle) notFound()

  const statusColor = {
    DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200',
    OPEN: 'bg-blue-100 text-blue-700',
    CLOSED: 'bg-green-100 text-green-700',
  }
  const reviewStatusColor = {
    NOT_STARTED: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-green-100 text-green-700',
  }
  const scope = cycle.teams.length === 0 ? 'All teams' : cycle.teams.map((t) => t.team.name).join(', ')
  const completed = cycle.reviews.filter((r) => r.status === 'COMPLETED').length

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/admin/review-cycles" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-200">
          ← All Cycles
        </Link>
        <div className="flex items-start justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{cycle.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[cycle.status]}`}>
                {cycle.status}
              </span>
            </div>
            {cycle.description && <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{cycle.description}</p>}
            <p className="text-xs text-gray-400 dark:text-gray-400 mt-2">
              {format(cycle.startDate, 'MMM d, yyyy')} – {format(cycle.endDate, 'MMM d, yyyy')} · {scope}
            </p>
          </div>
          <CycleActions cycleId={cycle.id} status={cycle.status} />
        </div>

        {cycle.reviews.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-4">
            {completed} of {cycle.reviews.length} reviews completed
          </p>
        )}
      </div>

      {cycle.status === 'DRAFT' ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-500 dark:text-gray-300">
          This cycle is still a draft. Click <strong>Open Cycle</strong> to auto-assign reviewers and send invites.
        </div>
      ) : cycle.reviews.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-500 dark:text-gray-300">
          No reviews — no active employees were in scope when the cycle opened.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"><div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-xs uppercase text-gray-500 dark:text-gray-300">
              <tr>
                <th className="px-4 py-2.5 text-left">Employee</th>
                <th className="px-4 py-2.5 text-left">Team</th>
                <th className="px-4 py-2.5 text-left">Reviewer</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {cycle.reviews.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{r.employee.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">{r.employee.title}</div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{r.employee.team.name}</td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">
                    {r.reviewer?.name ?? <span className="text-gray-400 dark:text-gray-400 italic">Unassigned</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${reviewStatusColor[r.status]}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {r.rating ? (
                      <span className="text-amber-500">
                        {'★'.repeat(r.rating)}
                        <span className="text-gray-200">{'★'.repeat(5 - r.rating)}</span>
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  )
}
