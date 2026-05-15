'use client'
import { useActionState, useState, useEffect } from 'react'
import { submitCycleReview } from '@/actions/reviews'
import { ReviewStatus } from '@prisma/client'
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'

type Props = {
  id: string
  employeeName: string
  employeeTitle: string
  teamName: string
  cycleName: string
  cycleDueDate: string
  status: ReviewStatus
  rating: number | null
  strengths: string | null
  improvements: string | null
  goals: string | null
  canEdit: boolean
}

const statusColor: Record<ReviewStatus, string> = {
  NOT_STARTED: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
}

const cardTheme: Record<ReviewStatus, string> = {
  NOT_STARTED: 'border-l-4 border-l-gray-300',
  IN_PROGRESS: 'border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-50/40 to-white dark:from-amber-950/30 dark:to-gray-900',
  COMPLETED: 'border-l-4 border-l-emerald-400 bg-gradient-to-r from-emerald-50/40 to-white dark:from-emerald-950/30 dark:to-gray-900',
}

export function ReviewCard(props: Props) {
  const [open, setOpen] = useState(props.canEdit && props.status === 'IN_PROGRESS')
  const [state, action, pending] = useActionState(submitCycleReview, undefined)
  const [justSubmitted, setJustSubmitted] = useState(false)
  const s = state as
    | { errors?: Record<string, string[]>; message?: string; success?: boolean; submitted?: boolean }
    | undefined

  useEffect(() => {
    if (s?.success && s?.submitted) {
      setJustSubmitted(true)
      const t = setTimeout(() => setOpen(false), 1500)
      return () => clearTimeout(t)
    }
  }, [s?.success, s?.submitted])

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-shadow hover:shadow-md ${cardTheme[props.status]}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-3 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 transition-colors"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 dark:text-gray-100">{props.employeeName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[props.status]}`}>
              {props.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-0.5">
            {props.employeeTitle} · {props.teamName}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
            {props.cycleName} · due {props.cycleDueDate}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {props.rating && (
            <span className="text-amber-500 text-sm">
              {'★'.repeat(props.rating)}
              <span className="text-gray-200">{'★'.repeat(5 - props.rating)}</span>
            </span>
          )}
          {open ? <ChevronUp size={16} className="text-gray-400 dark:text-gray-400" /> : <ChevronDown size={16} className="text-gray-400 dark:text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-5">
          {justSubmitted ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 size={40} className="text-green-500 mb-2" />
              <p className="font-medium text-gray-900 dark:text-gray-100">Review submitted</p>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">Thanks for completing this review.</p>
            </div>
          ) : props.canEdit ? (
            <form action={action} className="space-y-3">
              <input type="hidden" name="reviewId" value={props.id} />

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Overall Rating</label>
                <select
                  name="rating"
                  defaultValue={props.rating ?? ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Choose —</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? 'star' : 'stars'}</option>
                  ))}
                </select>
                {s?.errors?.rating && <p className="text-xs text-red-500 mt-1">{s.errors.rating[0]}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Strengths</label>
                <textarea
                  name="strengths"
                  rows={3}
                  defaultValue={props.strengths ?? ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="What did they do well this period?"
                />
                {s?.errors?.strengths && <p className="text-xs text-red-500 mt-1">{s.errors.strengths[0]}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Areas for Improvement</label>
                <textarea
                  name="improvements"
                  rows={3}
                  defaultValue={props.improvements ?? ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Where can they grow?"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Goals for Next Period</label>
                <textarea
                  name="goals"
                  rows={3}
                  defaultValue={props.goals ?? ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Specific objectives, projects, or development plans"
                />
              </div>

              {s?.message && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{s.message}</p>}
              {s?.success && !s.submitted && (
                <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">Saved as draft.</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  name="action"
                  value="save"
                  disabled={pending}
                  className="text-sm border border-gray-300 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 disabled:opacity-60 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  name="action"
                  value="submit"
                  disabled={pending}
                  className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {pending ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            </form>
          ) : (
            // Read-only view
            <div className="space-y-3 text-sm">
              {props.rating && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-300 mb-0.5">Rating</p>
                  <p className="text-amber-500">
                    {'★'.repeat(props.rating)}<span className="text-gray-200">{'★'.repeat(5 - props.rating)}</span>
                  </p>
                </div>
              )}
              {props.strengths && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-300 mb-0.5">Strengths</p>
                  <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{props.strengths}</p>
                </div>
              )}
              {props.improvements && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-300 mb-0.5">Areas for Improvement</p>
                  <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{props.improvements}</p>
                </div>
              )}
              {props.goals && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-300 mb-0.5">Goals</p>
                  <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{props.goals}</p>
                </div>
              )}
              {!props.rating && !props.strengths && !props.improvements && !props.goals && (
                <p className="text-gray-400 dark:text-gray-400 italic">No content recorded.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
