import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AssignUserForm } from './AssignUserForm'
import { RemoveAccessButton } from './RemoveAccessButton'
import { DeleteTeamButton } from './DeleteTeamButton'

export default async function AdminTeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      teamAccess: { include: { user: true } },
      _count: { select: { employees: true } },
    },
  })
  if (!team) notFound()

  const assignedUserIds = team.teamAccess.map((a) => a.userId)
  const availableUsers = await prisma.user.findMany({
    where: {
      id: { notIn: assignedUserIds },
      role: { in: ['MANAGER', 'TEAM_LEAD'] },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/admin/teams" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-200">← All Teams</Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{team.name}</h1>
            {team.description && <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{team.description}</p>}
            <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">{team._count.employees} employees</p>
          </div>
          <DeleteTeamButton teamId={team.id} name={team.name} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current access */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Assigned Users</h2>
          {team.teamAccess.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-400">No users assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {team.teamAccess.map((access) => (
                <div key={access.id} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{access.user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">{access.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      access.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                    }`}>
                      {access.role === 'MANAGER' ? 'Manager' : 'Team Lead'}
                    </span>
                    <RemoveAccessButton teamId={team.id} userId={access.userId} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assign new */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Assign User</h2>
          {availableUsers.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-400">
              No more users available to assign.{' '}
              <Link href="/dashboard/admin/users" className="text-blue-600 hover:underline">
                Create one
              </Link>
            </p>
          ) : (
            <AssignUserForm teamId={team.id} users={availableUsers.map(u => ({ id: u.id, name: u.name, role: u.role }))} />
          )}
        </div>
      </div>
    </div>
  )
}
