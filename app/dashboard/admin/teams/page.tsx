import { prisma } from '@/lib/db'
import Link from 'next/link'
import { CreateTeamForm } from './CreateTeamForm'

export default async function AdminTeamsPage() {
  const teams = await prisma.team.findMany({
    include: {
      _count: { select: { employees: true } },
      teamAccess: { include: { user: { select: { name: true, role: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Team Management</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {teams.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center text-sm text-gray-400 dark:text-gray-500">
              No teams yet. Create one →
            </div>
          ) : (
            teams.map((team) => {
              const managers = team.teamAccess.filter((a) => a.user.role === 'MANAGER')
              const leads = team.teamAccess.filter((a) => a.user.role === 'TEAM_LEAD')
              return (
                <Link key={team.id} href={`/dashboard/admin/teams/${team.id}`} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 block hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{team.name}</p>
                      {team.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{team.description}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{team._count.employees} members</span>
                        <span>{managers.length} manager{managers.length !== 1 ? 's' : ''}: {managers.map((m) => m.user.name).join(', ') || '—'}</span>
                        <span>{leads.length} lead{leads.length !== 1 ? 's' : ''}: {leads.map((l) => l.user.name).join(', ') || '—'}</span>
                      </div>
                    </div>
                    <span className="text-xs text-blue-600">Manage →</span>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        <div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Create Team</h2>
            <CreateTeamForm />
          </div>
        </div>
      </div>
    </div>
  )
}
