import { prisma } from '@/lib/db'
import { levelOf } from '@/lib/hierarchy'
import { ReportsToSelect } from './ReportsToSelect'
import { Role } from '@prisma/client'

export default async function HierarchyPage() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, reportsToId: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  // Group users by role for easier scanning
  const byRole: Record<Role, typeof users> = {
    ADMIN: [],
    MANAGING_DIRECTOR: [],
    MANAGER: [],
    TEAM_LEAD: [],
  }
  for (const u of users) byRole[u.role].push(u)

  const roleLabel: Record<Role, string> = {
    ADMIN: 'Admins',
    MANAGING_DIRECTOR: 'Managing Directors',
    MANAGER: 'Managers',
    TEAM_LEAD: 'Team Leads',
  }
  const roleBadgeColor: Record<Role, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    MANAGING_DIRECTOR: 'bg-indigo-100 text-indigo-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    TEAM_LEAD: 'bg-gray-100 text-gray-700',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Reporting Hierarchy</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set each user&apos;s direct supervisor. Workflow requests are routed up this chain first.
        </p>
        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-900">
          <strong>Auto-propagation:</strong> when you set a supervisor, that person (and anyone
          above them) automatically gains access to every team this user has access to.
          Existing team roles are preserved — new access is granted at the supervisor&apos;s own
          rank. The same cascade kicks in whenever you add someone to a team.
        </div>
      </div>

      <div className="space-y-6">
        {(['MANAGING_DIRECTOR', 'MANAGER', 'TEAM_LEAD'] as const).map((role) => {
          if (byRole[role].length === 0) return null

          // Valid candidates to be the supervisor: anyone strictly above this user's role.
          const candidates = users.filter((u) => levelOf(u.role) > levelOf(role))

          return (
            <section key={role}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                {roleLabel[role]} · {byRole[role].length}
              </h2>
              <div className="space-y-2">
                {byRole[role].map((u) => (
                  <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">{u.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadgeColor[u.role]}`}>
                          {roleLabel[u.role].replace(/s$/, '')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{u.email}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">Reports to:</span>
                      <ReportsToSelect
                        userId={u.id}
                        currentReportsToId={u.reportsToId}
                        candidates={candidates.map((c) => ({
                          id: c.id,
                          label: `${c.name} (${roleLabel[c.role].replace(/s$/, '')})`,
                        }))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {byRole.ADMIN.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Admins · {byRole.ADMIN.length}
            </h2>
            <p className="text-sm text-gray-400">Admins sit at the top of the chain and do not report to anyone in the system.</p>
          </section>
        )}
      </div>
    </div>
  )
}
