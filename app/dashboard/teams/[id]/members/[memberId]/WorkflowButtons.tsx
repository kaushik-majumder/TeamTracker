'use client'
import { useState, useActionState, useEffect } from 'react'
import { createPromotionRequest, createSalaryHikeRequest } from '@/actions/workflows'
import { TrendingUp, DollarSign, X, CheckCircle2 } from 'lucide-react'
import { Role } from '@prisma/client'

type Props = {
  employeeId: string
  teamId: string
  currentTitle: string
  role: Role
}

type ActionState =
  | { success: true }
  | { errors: Record<string, string[]> }
  | undefined

export function WorkflowButtons({ employeeId, teamId, currentTitle, role }: Props) {
  const [modal, setModal] = useState<'promotion' | 'salary' | null>(null)
  const [promoState, promoAction, promoPending] = useActionState(createPromotionRequest, undefined)
  const [salaryState, salaryAction, salaryPending] = useActionState(createSalaryHikeRequest, undefined)
  const [showSuccess, setShowSuccess] = useState(false)

  const ps = promoState as ActionState
  const ss = salaryState as ActionState

  // Auto-close modal a moment after success so the user sees confirmation
  useEffect(() => {
    if ((ps && 'success' in ps && ps.success) || (ss && 'success' in ss && ss.success)) {
      setShowSuccess(true)
      const t = setTimeout(() => {
        setShowSuccess(false)
        setModal(null)
      }, 1200)
      return () => clearTimeout(t)
    }
  }, [ps, ss])

  // Admin doesn't recommend; everyone else (lead, manager, MD) can.
  if (role === 'ADMIN') return null

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setModal('promotion')}
          className="flex items-center gap-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <TrendingUp size={14} />
          Recommend Promotion
        </button>
        <button
          onClick={() => setModal('salary')}
          className="flex items-center gap-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <DollarSign size={14} />
          Salary Hike
        </button>
      </div>

      {/* Promotion Modal */}
      {modal === 'promotion' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Recommend Promotion</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-gray-400 dark:text-gray-500" /></button>
            </div>

            {showSuccess && ps && 'success' in ps ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 size={48} className="text-green-500 mb-3" />
                <p className="font-medium text-gray-900 dark:text-gray-100">Promotion request submitted</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sent to the team&apos;s manager for review.</p>
              </div>
            ) : (
              <form action={promoAction} className="space-y-3">
                <input type="hidden" name="employeeId" value={employeeId} />
                <input type="hidden" name="teamId" value={teamId} />

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current Title</label>
                  <input name="currentTitle" defaultValue={currentTitle} readOnly
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-gray-50 dark:bg-gray-800/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Proposed Title</label>
                  <input name="proposedTitle"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Senior Engineer" />
                  {ps && 'errors' in ps && ps.errors.proposedTitle && (
                    <p className="text-xs text-red-500 mt-1">{ps.errors.proposedTitle[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Justification</label>
                  <textarea name="justification" rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Why does this person deserve a promotion? (at least 10 characters)" />
                  {ps && 'errors' in ps && ps.errors.justification && (
                    <p className="text-xs text-red-500 mt-1">{ps.errors.justification[0]}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setModal(null)}
                    className="flex-1 text-sm border border-gray-300 text-gray-600 dark:text-gray-400 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={promoPending}
                    className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors">
                    {promoPending ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Salary Hike Modal */}
      {modal === 'salary' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Recommend Salary Hike</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-gray-400 dark:text-gray-500" /></button>
            </div>

            {showSuccess && ss && 'success' in ss ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 size={48} className="text-green-500 mb-3" />
                <p className="font-medium text-gray-900 dark:text-gray-100">Salary hike request submitted</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sent to the team&apos;s manager for review.</p>
              </div>
            ) : (
              <form action={salaryAction} className="space-y-3">
                <input type="hidden" name="employeeId" value={employeeId} />
                <input type="hidden" name="teamId" value={teamId} />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current Salary ($)</label>
                    <input name="currentSalary" type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="80000" />
                    {ss && 'errors' in ss && ss.errors.currentSalary && (
                      <p className="text-xs text-red-500 mt-1">{ss.errors.currentSalary[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Proposed Salary ($)</label>
                    <input name="proposedSalary" type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="90000" />
                    {ss && 'errors' in ss && ss.errors.proposedSalary && (
                      <p className="text-xs text-red-500 mt-1">{ss.errors.proposedSalary[0]}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Justification</label>
                  <textarea name="justification" rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Reason for the salary hike request… (at least 10 characters)" />
                  {ss && 'errors' in ss && ss.errors.justification && (
                    <p className="text-xs text-red-500 mt-1">{ss.errors.justification[0]}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setModal(null)}
                    className="flex-1 text-sm border border-gray-300 text-gray-600 dark:text-gray-400 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={salaryPending}
                    className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors">
                    {salaryPending ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
