import { prisma } from '@/lib/db'
import { format } from 'date-fns'
import Link from 'next/link'
import { ActorFilter } from './ActorFilter'

const PAGE_SIZE = 50

const ACTION_COLOR: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  grant: 'bg-emerald-100 text-emerald-700',
  revoke: 'bg-amber-100 text-amber-700',
  open: 'bg-blue-100 text-blue-700',
  close: 'bg-gray-100 text-gray-700',
  submit: 'bg-indigo-100 text-indigo-700',
  review: 'bg-purple-100 text-purple-700',
  markLeft: 'bg-amber-100 text-amber-700',
  reactivate: 'bg-emerald-100 text-emerald-700',
  set: 'bg-blue-100 text-blue-700',
  resync: 'bg-blue-100 text-blue-700',
  add: 'bg-green-100 text-green-700',
  save: 'bg-gray-100 text-gray-700',
  setup: 'bg-emerald-100 text-emerald-700',
}

function colorForAction(action: string) {
  const verb = action.split('.').pop() ?? ''
  return ACTION_COLOR[verb] ?? 'bg-gray-100 text-gray-600'
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; actor?: string }>
}) {
  const { page = '1', action: actionFilter, actor: actorFilter } = await searchParams
  const pageNum = Math.max(1, parseInt(page) || 1)
  const skip = (pageNum - 1) * PAGE_SIZE

  const where = {
    ...(actionFilter ? { action: { startsWith: actionFilter } } : {}),
    ...(actorFilter ? { actorId: actorFilter } : {}),
  }

  const [logs, total, users, distinctActions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip,
    }),
    prisma.auditLog.count({ where }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.auditLog.findMany({ distinct: ['action'], select: { action: true } }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const actionPrefixes = Array.from(new Set(distinctActions.map((a) => a.action.split('.')[0]))).sort()

  const linkFor = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    if ((overrides.page ?? pageNum.toString()) !== '1') params.set('page', overrides.page ?? pageNum.toString())
    const a = overrides.action ?? actionFilter
    if (a) params.set('action', a)
    const ac = overrides.actor ?? actorFilter
    if (ac) params.set('actor', ac)
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every state-changing action recorded by the system. Useful for compliance and debugging.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <div className="flex flex-wrap gap-1">
            <Link
              href={linkFor({ action: '', page: '1' })}
              className={`text-xs px-3 py-1.5 rounded-lg border ${
                !actionFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </Link>
            {actionPrefixes.map((p) => (
              <Link
                key={p}
                href={linkFor({ action: p, page: '1' })}
                className={`text-xs px-3 py-1.5 rounded-lg border ${
                  actionFilter === p ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Actor</label>
          <ActorFilter users={users} current={actorFilter} />
        </div>

        <div className="text-xs text-gray-500 ml-auto">
          {total.toLocaleString()} {total === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">
          No audit entries match the filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left">When</th>
                <th className="px-4 py-2.5 text-left">Actor</th>
                <th className="px-4 py-2.5 text-left">Action</th>
                <th className="px-4 py-2.5 text-left">Target</th>
                <th className="px-4 py-2.5 text-left">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap text-xs">
                    {format(log.createdAt, 'MMM d, HH:mm:ss')}
                  </td>
                  <td className="px-4 py-2.5">
                    {log.actor ? (
                      <span className="text-gray-800 font-medium">{log.actor.name}</span>
                    ) : (
                      <span className="text-gray-400 italic">system / deleted</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${colorForAction(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">
                    {log.entityType ? (
                      <>
                        <span className="text-gray-800">{log.entityType}</span>
                        {log.entityId && <span className="text-gray-400 ml-1">{log.entityId.slice(0, 8)}</span>}
                      </>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs max-w-md">
                    {log.details ? (
                      <code className="text-[11px] text-gray-500 break-all line-clamp-2">
                        {JSON.stringify(log.details)}
                      </code>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-gray-500">
            Page {pageNum} of {totalPages}
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link
                href={linkFor({ page: (pageNum - 1).toString() })}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                ← Previous
              </Link>
            )}
            {pageNum < totalPages && (
              <Link
                href={linkFor({ page: (pageNum + 1).toString() })}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
