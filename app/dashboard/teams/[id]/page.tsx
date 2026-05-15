import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format, differenceInYears, isSameMonth } from 'date-fns'
import { UserPlus, Star } from 'lucide-react'
import { LeadershipWorkflowButtons } from './LeadershipWorkflowButtons'
import { EditUserButton } from '@/components/EditUserButton'
import { levelOf } from '@/lib/hierarchy'
import { Role } from '@prisma/client'

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireAuth()

  const isAdmin = session.role === 'ADMIN'
  const team = await prisma.team.findFirst({
    where: isAdmin
      ? { id }
      : { id, teamAccess: { some: { userId: session.userId } } },
    include: {
      employees: {
        include: { _count: { select: { performanceRecords: true } } },
        orderBy: { name: 'asc' },
      },
      teamAccess: { include: { user: { select: { id: true, name: true, role: true, email: true } } } },
    },
  })

  if (!team) notFound()

  const today = new Date()
  // The viewer's role on THIS team (admin treated as top of chain)
  const myAccess = team.teamAccess.find((a) => a.userId === session.userId)
  const viewerTeamRole: Role | null = isAdmin ? 'ADMIN' : myAccess?.role ?? null

  const roleLabel: Record<Role, string> = {
    ADMIN: 'Admin',
    MANAGING_DIRECTOR: 'Managing Director',
    MANAGER: 'Manager',
    TEAM_LEAD: 'Team Lead',
  }
  const roleBadgeColor: Record<Role, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    MANAGING_DIRECTOR: 'bg-indigo-100 text-indigo-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    TEAM_LEAD: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/teams" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-300">
          ← Teams
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{team.name}</h1>
            {team.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{team.description}</p>}
          </div>
          <Link
            href={`/dashboard/teams/${team.id}/members/new`}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <UserPlus size={14} />
            Add Member
          </Link>
        </div>
      </div>

      {/* Leadership / Team Access — visible to anyone on the team */}
      {team.teamAccess.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Leadership</h2>
          <div className="space-y-2">
            {team.teamAccess.map((access) => {
              // A viewer can raise workflows on someone only if they outrank them on the team.
              const canRecommend =
                viewerTeamRole !== null &&
                access.userId !== session.userId &&
                levelOf(viewerTeamRole) > levelOf(access.role) &&
                viewerTeamRole !== 'ADMIN' // admin doesn't recommend, they approve

              // Same outranking rule controls whether the viewer can edit this person.
              const canEdit =
                viewerTeamRole !== null &&
                access.userId !== session.userId &&
                (isAdmin || levelOf(viewerTeamRole) > levelOf(access.role))

              return (
                <div key={access.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{access.user.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">{access.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadgeColor[access.role]}`}>
                      {roleLabel[access.role]}
                    </span>
                    {canEdit && (
                      <EditUserButton
                        userId={access.userId}
                        defaultName={access.user.name}
                        defaultEmail={access.user.email}
                      />
                    )}
                    {canRecommend && (
                      <LeadershipWorkflowButtons
                        subjectUserId={access.userId}
                        subjectName={access.user.name}
                        subjectCurrentTitle={roleLabel[access.role]}
                        teamId={team.id}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Members */}
      <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Members <span className="text-gray-400 dark:text-gray-500 font-normal">({team.employees.length})</span>
      </h2>
      {team.employees.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No members yet.{' '}
          <Link href={`/dashboard/teams/${team.id}/members/new`} className="text-blue-600 hover:underline">
            Add one
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {team.employees.map((emp) => {
            const yearsAtCompany = differenceInYears(today, emp.joinDate)
            const isActive = emp.status === 'ACTIVE'
            const isAnniversaryMonth = isActive && isSameMonth(
              new Date(today.getFullYear(), today.getMonth()),
              new Date(today.getFullYear(), new Date(emp.joinDate).getMonth())
            )
            return (
              <Link
                key={emp.id}
                href={`/dashboard/teams/${team.id}/members/${emp.id}`}
                className={`rounded-xl border p-4 flex items-center justify-between hover:shadow-sm transition-shadow block ${
                  isActive ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-800 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                      {emp.name}
                    </span>
                    {isAnniversaryMonth && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        🎂 Anniversary
                      </span>
                    )}
                    {!isActive && (
                      <span className="text-xs bg-gray-200 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                        Former
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{emp.title}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                  <span>{yearsAtCompany}y {format(emp.joinDate, 'MMM yyyy')}</span>
                  <div className="flex items-center gap-1">
                    <Star size={12} />
                    {emp._count.performanceRecords}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
