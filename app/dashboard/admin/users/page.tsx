import { prisma } from '@/lib/db'
import { CreateUserForm } from './CreateUserForm'
import { DeletePersonButton } from './DeletePersonButton'
import { EditUserButton } from '@/components/EditUserButton'
import { format } from 'date-fns'

export default async function AdminUsersPage() {
  const [users, employees, teams] = await Promise.all([
    prisma.user.findMany({
      include: { teamAccess: { include: { team: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.employee.findMany({
      include: { team: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.team.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  const roleStyles = {
    ADMIN: 'bg-purple-100 text-purple-700',
    MANAGING_DIRECTOR: 'bg-indigo-100 text-indigo-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    TEAM_LEAD: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200',
    TEAM_MEMBER: 'bg-emerald-100 text-emerald-700',
  }

  const roleLabel = {
    ADMIN: 'Admin',
    MANAGING_DIRECTOR: 'Managing Director',
    MANAGER: 'Manager',
    TEAM_LEAD: 'Team Lead',
    TEAM_MEMBER: 'Team Member',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Manage People</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
          Create managers, team leads, or team members. Optionally assign to a team in the same step.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {/* Users (Admin / Manager / Team Lead) */}
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 mt-2">
            Users · {users.length}
          </p>
          {users.map((u) => (
            <div key={u.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{u.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${roleStyles[u.role]}`}>
                    {roleLabel[u.role]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-300">{u.email}</p>
                {u.teamAccess.length > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">Teams: {u.teamAccess.map((a) => a.team.name).join(', ')}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">Joined {format(u.createdAt, 'MMM d, yyyy')}</p>
              </div>
              {u.role !== 'ADMIN' && (
                <div className="flex items-center gap-1">
                  <EditUserButton userId={u.id} defaultName={u.name} defaultEmail={u.email} />
                  <DeletePersonButton id={u.id} name={u.name} kind="user" />
                </div>
              )}
            </div>
          ))}

          {/* Team members */}
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 mt-6">
            Team Members · {employees.length}
          </p>
          {employees.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-400">No team members yet.</p>
          ) : (
            employees.map((e) => (
              <div key={e.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{e.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${roleStyles.TEAM_MEMBER}`}>
                      Team Member
                    </span>
                    {e.status === 'LEFT' && (
                      <span className="text-xs bg-gray-200 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-full">Former</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-300">{e.title} · {e.email}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                    Team: {e.team.name} · Joined {format(e.joinDate, 'MMM d, yyyy')}
                  </p>
                </div>
                <DeletePersonButton id={e.id} name={e.name} kind="employee" />
              </div>
            ))
          )}
        </div>

        <div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 sticky top-8">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Add Person</h2>
            <CreateUserForm teams={teams} />
          </div>
        </div>
      </div>
    </div>
  )
}
