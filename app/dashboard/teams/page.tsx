import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { teamColor } from '@/lib/team-color'

export default async function TeamsPage() {
  const session = await requireAuth()
  const isAdmin = session.role === 'ADMIN'
  const teams = await prisma.team.findMany({
    where: isAdmin ? {} : { teamAccess: { some: { userId: session.userId } } },
    include: {
      _count: { select: { employees: true } },
      teamAccess: { include: { user: { select: { name: true, role: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Teams</h1>
        {isAdmin && (
          <Link
            href="/dashboard/admin/teams"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Manage Teams
          </Link>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-12 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-sm mb-3">
            <Users size={32} className="text-blue-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">No teams yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => {
            const c = teamColor(team.name)
            const lead = team.teamAccess.find((a) => a.user.role === 'TEAM_LEAD')
            return (
              <Link
                key={team.id}
                href={`/dashboard/teams/${team.id}`}
                className={`group relative bg-white dark:bg-gray-900 rounded-xl border ${c.border} p-5 overflow-hidden transition-all hover:shadow-lg ${c.hoverShadow} hover:-translate-y-0.5 block`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.accent}`} />
                <div className="pl-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{team.name}</p>
                      {team.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{team.description}</p>
                      )}
                    </div>
                    <span className={`text-xs ${c.soft} ${c.text} font-medium px-2 py-1 rounded-full whitespace-nowrap`}>
                      {team._count.employees} member{team._count.employees !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {lead && (
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-4">
                      Lead: <span className="font-medium text-gray-700 dark:text-gray-200">{lead.user.name}</span>
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
