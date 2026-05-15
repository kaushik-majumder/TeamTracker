import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { format, differenceInYears } from 'date-fns'
import { Calendar, PartyPopper, Mail } from 'lucide-react'
import { teamColor } from '@/lib/team-color'

export default async function AnniversariesPage() {
  const session = await requireAuth()
  const isAdmin = session.role === 'ADMIN'

  // Scope to teams the viewer has access to (admin sees all)
  const teamFilter = isAdmin
    ? {}
    : { team: { teamAccess: { some: { userId: session.userId } } } }

  const employees = await prisma.employee.findMany({
    where: { status: 'ACTIVE', ...teamFilter },
    include: { team: { select: { id: true, name: true } } },
  })

  const today = new Date()
  const todayMonth = today.getMonth() + 1
  const todayDay = today.getDate()
  const todayYear = today.getFullYear()

  // Filter to this month's anniversaries, exclude employees who haven't
  // completed a full year yet.
  const thisMonth = employees
    .filter((e) => {
      const j = new Date(e.joinDate)
      return j.getMonth() + 1 === todayMonth && j.getFullYear() < todayYear
    })
    .map((e) => {
      const j = new Date(e.joinDate)
      return {
        ...e,
        day: j.getDate(),
        years: differenceInYears(today, j),
        isToday: j.getDate() === todayDay,
        annivThisYear: new Date(todayYear, todayMonth - 1, j.getDate()),
      }
    })
    .sort((a, b) => a.day - b.day)

  const todays = thisMonth.filter((e) => e.isToday)
  const upcoming = thisMonth.filter((e) => e.day >= todayDay && !e.isToday)
  const past = thisMonth.filter((e) => e.day < todayDay)

  const monthName = format(today, 'MMMM yyyy')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Anniversaries · {monthName}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {thisMonth.length === 0
            ? 'No anniversaries this month.'
            : `${thisMonth.length} team member${thisMonth.length === 1 ? '' : 's'} celebrating this month.`}
        </p>
      </div>

      {/* Today */}
      {todays.length > 0 && (
        <section className="mb-8">
          <div className="bg-gradient-to-r from-amber-50 via-rose-50 to-purple-50 dark:from-amber-950/40 dark:via-rose-950/40 dark:to-purple-950/40 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-6 mb-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-white">
                <PartyPopper size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Today</p>
                <h2 className="font-bold text-gray-900 dark:text-gray-100">
                  {todays.length === 1 ? 'Celebrating today!' : `${todays.length} celebrations today!`}
                </h2>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {todays.map((emp) => (
                <AnnivCard
                  key={emp.id}
                  name={emp.name}
                  email={emp.email}
                  title={emp.title}
                  teamName={emp.team.name}
                  teamId={emp.team.id}
                  employeeId={emp.id}
                  years={emp.years}
                  date={emp.annivThisYear}
                  highlight
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming this month */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
            Upcoming · {upcoming.length}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((emp) => (
              <AnnivCard
                key={emp.id}
                name={emp.name}
                email={emp.email}
                title={emp.title}
                teamName={emp.team.name}
                teamId={emp.team.id}
                employeeId={emp.id}
                years={emp.years}
                date={emp.annivThisYear}
              />
            ))}
          </div>
        </section>
      )}

      {/* Earlier this month */}
      {past.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
            Earlier this month · {past.length}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {past.map((emp) => (
              <AnnivCard
                key={emp.id}
                name={emp.name}
                email={emp.email}
                title={emp.title}
                teamName={emp.team.name}
                teamId={emp.team.id}
                employeeId={emp.id}
                years={emp.years}
                date={emp.annivThisYear}
                muted
              />
            ))}
          </div>
        </section>
      )}

      {thisMonth.length === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40 p-12 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-sm mb-3">
            <Calendar size={32} className="text-blue-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            No team members have anniversaries in {monthName}.
          </p>
        </div>
      )}
    </div>
  )
}

function AnnivCard(props: {
  name: string
  email: string
  title: string
  teamName: string
  teamId: string
  employeeId: string
  years: number
  date: Date
  highlight?: boolean
  muted?: boolean
}) {
  const c = teamColor(props.teamName)
  return (
    <Link
      href={`/dashboard/teams/${props.teamId}/members/${props.employeeId}`}
      className={`relative group rounded-xl border p-4 transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${
        props.highlight
          ? 'bg-white dark:bg-gray-900 border-amber-200 dark:border-amber-900/40 shadow-md shadow-amber-500/10'
          : props.muted
            ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 opacity-80'
            : `bg-white dark:bg-gray-900 ${c.border} ${c.hoverShadow}`
      }`}
    >
      {!props.muted && !props.highlight && <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.accent}`} />}
      <div className={!props.muted && !props.highlight ? 'pl-2' : ''}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{props.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{props.title}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-2xl font-bold ${props.highlight ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-200'}`}>
              {props.years}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
              {props.years === 1 ? 'year' : 'years'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          <span className={`${c.soft} ${c.text} px-2 py-0.5 rounded-full font-medium`}>
            {props.teamName}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {format(props.date, 'MMM d')}
          </span>
          <a
            href={`mailto:${props.email}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <Mail size={12} />
            {props.email}
          </a>
        </div>
      </div>
    </Link>
  )
}
