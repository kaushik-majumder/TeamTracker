import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Users, GitBranch, TrendingUp, Calendar, UserPlus, Building2 } from 'lucide-react'
import { teamColor } from '@/lib/team-color'

// Color theme per stat type. Listed explicitly so Tailwind's JIT picks
// every class up at build time (template strings would be missed).
const STAT_THEMES = {
  blue: {
    icon: 'text-blue-600 bg-blue-50',
    top: 'before:bg-gradient-to-r before:from-blue-400 before:to-blue-600',
    hover: 'hover:shadow-blue-500/10',
  },
  amber: {
    icon: 'text-amber-600 bg-amber-50',
    top: 'before:bg-gradient-to-r before:from-amber-400 before:to-amber-600',
    hover: 'hover:shadow-amber-500/10',
  },
  purple: {
    icon: 'text-purple-600 bg-purple-50',
    top: 'before:bg-gradient-to-r before:from-purple-400 before:to-purple-600',
    hover: 'hover:shadow-purple-500/10',
  },
  green: {
    icon: 'text-emerald-600 bg-emerald-50',
    top: 'before:bg-gradient-to-r before:from-emerald-400 before:to-emerald-600',
    hover: 'hover:shadow-emerald-500/10',
  },
} as const

type ThemeKey = keyof typeof STAT_THEMES

export default async function DashboardPage() {
  const session = await requireAuth()
  const isAdmin = session.role === 'ADMIN'

  // Admin sees all teams; others only see assigned teams
  const teamFilter = isAdmin ? {} : { teamAccess: { some: { userId: session.userId } } }

  const teams = await prisma.team.findMany({
    where: teamFilter,
    include: { _count: { select: { employees: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const teamIds = teams.map((t) => t.id)

  const [pendingPromotions, pendingSalaryHikes, upcomingAnniversaries, userCount] = await Promise.all([
    prisma.promotionRequest.count({ where: { teamId: { in: teamIds }, status: 'PENDING' } }),
    prisma.salaryHikeRequest.count({ where: { teamId: { in: teamIds }, status: 'PENDING' } }),
    (async () => {
      const today = new Date()
      const month = today.getMonth() + 1
      const employees = await prisma.employee.findMany({
        where: { teamId: { in: teamIds }, status: 'ACTIVE' },
        select: { joinDate: true },
      })
      return employees.filter((e) => new Date(e.joinDate).getMonth() + 1 === month).length
    })(),
    isAdmin ? prisma.user.count() : Promise.resolve(0),
  ])

  const stats: Array<{
    label: string
    value: number
    icon: typeof UserPlus
    href: string
    color: ThemeKey
  }> = isAdmin
    ? [
        { label: 'Users', value: userCount, icon: UserPlus, href: '/dashboard/admin/users', color: 'purple' },
        { label: 'Teams', value: teams.length, icon: Building2, href: '/dashboard/admin/teams', color: 'blue' },
        { label: 'Pending Promotions', value: pendingPromotions, icon: TrendingUp, href: '/dashboard/workflows', color: 'amber' },
        { label: 'Anniversaries This Month', value: upcomingAnniversaries, icon: Calendar, href: '/dashboard/anniversaries', color: 'green' },
      ]
    : [
        { label: 'Teams', value: teams.length, icon: Users, href: '/dashboard/teams', color: 'blue' },
        { label: 'Pending Promotions', value: pendingPromotions, icon: TrendingUp, href: '/dashboard/workflows', color: 'amber' },
        { label: 'Pending Salary Hikes', value: pendingSalaryHikes, icon: GitBranch, href: '/dashboard/workflows', color: 'purple' },
        { label: 'Anniversaries This Month', value: upcomingAnniversaries, icon: Calendar, href: '/dashboard/anniversaries', color: 'green' },
      ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back, {session.name.split(' ')[0]}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
          {
            isAdmin
              ? 'Admin view'
              : session.role === 'MANAGING_DIRECTOR'
                ? 'Managing Director view'
                : session.role === 'MANAGER'
                  ? 'Manager view'
                  : 'Team Lead view'
          } ·{' '}
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href, color }) => {
          const theme = STAT_THEMES[color]
          return (
            <Link
              key={label}
              href={href}
              className={`relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 ${theme.hover} before:absolute before:top-0 before:left-0 before:right-0 before:h-1 ${theme.top}`}
            >
              <div className={`inline-flex p-2 rounded-lg mb-3 ${theme.icon}`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-0.5">{label}</p>
            </Link>
          )
        })}
      </div>

      {isAdmin && (
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <Link
            href="/dashboard/admin/users"
            className="group bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-gray-900 rounded-xl border border-purple-100 dark:border-purple-900/40 p-5 transition-all hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5 flex items-start gap-3"
          >
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <UserPlus size={20} />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Create User</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Add a manager or team lead and optionally assign them to a team in one step.</p>
            </div>
          </Link>
          <Link
            href="/dashboard/admin/teams"
            className="group bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-900 rounded-xl border border-blue-100 dark:border-blue-900/40 p-5 transition-all hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 flex items-start gap-3"
          >
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Building2 size={20} />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Manage Teams</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Create teams and assign which managers and leads can see them.</p>
            </div>
          </Link>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{isAdmin ? 'All Teams' : 'Your Teams'}</h2>
          {isAdmin && (
            <Link href="/dashboard/admin/teams" className="text-sm text-blue-600 hover:underline">
              Manage →
            </Link>
          )}
        </div>
        {teams.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500 dark:text-gray-300 text-sm">
            {isAdmin ? (
              <>
                No teams yet.{' '}
                <Link href="/dashboard/admin/users" className="text-blue-600 hover:underline">
                  Create your first user
                </Link>{' '}
                — you can create a team in the same step.
              </>
            ) : (
              'No teams assigned to you yet. Ask your admin for access.'
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {teams.map((team) => {
              const c = teamColor(team.name)
              return (
                <Link
                  key={team.id}
                  href={`/dashboard/teams/${team.id}`}
                  className={`group relative bg-white dark:bg-gray-900 rounded-xl border ${c.border} p-5 overflow-hidden transition-all hover:shadow-lg ${c.hoverShadow} hover:-translate-y-0.5`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.accent}`} />
                  <div className="pl-2">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{team.name}</p>
                    {team.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-300 mt-1 truncate">{team.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-3">
                      <Users size={12} className={c.text} />
                      <p className={`text-xs font-medium ${c.text}`}>
                        {team._count.employees} member{team._count.employees !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
