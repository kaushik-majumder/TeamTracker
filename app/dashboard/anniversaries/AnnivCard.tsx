'use client'
import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, Mail } from 'lucide-react'
import { teamColor } from '@/lib/team-color'

type Props = {
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
}

export function AnnivCard(props: Props) {
  const c = teamColor(props.teamName)
  return (
    <Link
      href={`/dashboard/teams/${props.teamId}/members/${props.employeeId}`}
      className={`relative group rounded-xl border p-4 transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden block ${
        props.highlight
          ? 'bg-white dark:bg-gray-900 border-amber-200 dark:border-amber-900/40 shadow-md shadow-amber-500/10'
          : props.muted
            ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 opacity-80'
            : `bg-white dark:bg-gray-900 ${c.border} ${c.hoverShadow}`
      }`}
    >
      {!props.muted && !props.highlight && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.accent}`} />
      )}
      <div className={!props.muted && !props.highlight ? 'pl-2' : ''}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{props.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{props.title}</p>
          </div>
          <div className="text-right shrink-0">
            <p
              className={`text-2xl font-bold ${
                props.highlight ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-200'
              }`}
            >
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
          {/* Email is a click-to-copy span (not a nested <a>) — keeps the
              clickable card intact and avoids invalid nested-anchor HTML. */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.location.href = `mailto:${props.email}`
            }}
            className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title={`Email ${props.email}`}
          >
            <Mail size={12} />
            <span className="truncate max-w-[160px]">{props.email}</span>
          </button>
        </div>
      </div>
    </Link>
  )
}
