import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format, differenceInYears, isSameMonth } from 'date-fns'
import { UserPlus, Star, TrendingUp, DollarSign } from 'lucide-react'

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireAuth()

  const team = await prisma.team.findFirst({
    where: { id, teamAccess: { some: { userId: session.userId } } },
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

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/teams" className="text-sm text-gray-500 hover:text-gray-700">
          ← Teams
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{team.name}</h1>
            {team.description && <p className="text-sm text-gray-500 mt-1">{team.description}</p>}
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

      {/* Team access section (manager only) */}
      {session.role === 'MANAGER' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Team Access</h2>
          <div className="space-y-2">
            {team.teamAccess.map((access) => (
              <div key={access.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-800">{access.user.name}</span>
                  <span className="text-gray-500 ml-2">{access.user.email}</span>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {access.role === 'MANAGER' ? 'Manager' : 'Team Lead'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <h2 className="font-semibold text-gray-900 mb-3">
        Members <span className="text-gray-400 font-normal">({team.employees.length})</span>
      </h2>
      {team.employees.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          No members yet.{' '}
          <Link href={`/dashboard/teams/${team.id}/members/new`} className="text-blue-600 hover:underline">
            Add one
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {team.employees.map((emp) => {
            const yearsAtCompany = differenceInYears(today, emp.joinDate)
            const isAnniversaryMonth = isSameMonth(
              new Date(today.getFullYear(), today.getMonth()),
              new Date(today.getFullYear(), new Date(emp.joinDate).getMonth())
            )
            return (
              <Link
                key={emp.id}
                href={`/dashboard/teams/${team.id}/members/${emp.id}`}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-sm transition-shadow block"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{emp.name}</span>
                    {isAnniversaryMonth && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        🎂 Anniversary
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{emp.title}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
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
