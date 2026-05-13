import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Users, GitBranch, TrendingUp, Calendar } from 'lucide-react'

export default async function DashboardPage() {
  const session = await requireAuth()

  const teams = await prisma.team.findMany({
    where: { teamAccess: { some: { userId: session.userId } } },
    include: { _count: { select: { employees: true } } },
  })

  const teamIds = teams.map((t) => t.id)

  const [pendingPromotions, pendingSalaryHikes, upcomingAnniversaries] = await Promise.all([
    prisma.promotionRequest.count({ where: { teamId: { in: teamIds }, status: 'PENDING' } }),
    prisma.salaryHikeRequest.count({ where: { teamId: { in: teamIds }, status: 'PENDING' } }),
    (async () => {
      const today = new Date()
      const month = today.getMonth() + 1
      const employees = await prisma.employee.findMany({
        where: { teamId: { in: teamIds } },
        select: { joinDate: true },
      })
      return employees.filter((e) => new Date(e.joinDate).getMonth() + 1 === month).length
    })(),
  ])

  const stats = [
    { label: 'Teams', value: teams.length, icon: Users, href: '/dashboard/teams', color: 'blue' },
    {
      label: 'Pending Promotions',
      value: pendingPromotions,
      icon: TrendingUp,
      href: '/dashboard/workflows',
      color: 'amber',
    },
    {
      label: 'Pending Salary Hikes',
      value: pendingSalaryHikes,
      icon: GitBranch,
      href: '/dashboard/workflows',
      color: 'purple',
    },
    {
      label: 'Anniversaries This Month',
      value: upcomingAnniversaries,
      icon: Calendar,
      href: '/dashboard/teams',
      color: 'green',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {session.name.split(' ')[0]}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {session.role === 'MANAGER' ? 'Manager view' : 'Team Lead view'} ·{' '}
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
          >
            <div className={`inline-flex p-2 rounded-lg bg-${color}-50 mb-3`}>
              <Icon size={18} className={`text-${color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Your Teams</h2>
          {session.role === 'MANAGER' && (
            <Link href="/dashboard/teams/new" className="text-sm text-blue-600 hover:underline">
              + New Team
            </Link>
          )}
        </div>
        {teams.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
            No teams yet.{' '}
            {session.role === 'MANAGER' && (
              <Link href="/dashboard/teams/new" className="text-blue-600 hover:underline">
                Create one
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/dashboard/teams/${team.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
              >
                <p className="font-medium text-gray-900">{team.name}</p>
                {team.description && (
                  <p className="text-sm text-gray-500 mt-1 truncate">{team.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-3">
                  {team._count.employees} member{team._count.employees !== 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
