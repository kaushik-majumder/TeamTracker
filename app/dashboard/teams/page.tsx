import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Users } from 'lucide-react'

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
        <h1 className="text-xl font-bold text-gray-900">Teams</h1>
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
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No teams yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => {
            const lead = team.teamAccess.find((a) => a.user.role === 'TEAM_LEAD')
            return (
              <Link
                key={team.id}
                href={`/dashboard/teams/${team.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow block"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{team.name}</p>
                    {team.description && (
                      <p className="text-sm text-gray-500 mt-1">{team.description}</p>
                    )}
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {team._count.employees} members
                  </span>
                </div>
                {lead && (
                  <p className="text-xs text-gray-400 mt-4">Lead: {lead.user.name}</p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
