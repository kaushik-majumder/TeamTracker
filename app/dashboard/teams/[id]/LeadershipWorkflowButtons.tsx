'use client'
import { useState, useActionState, useEffect } from 'react'
import { createPromotionRequest, createSalaryHikeRequest } from '@/actions/workflows'
import { TrendingUp, DollarSign, X, CheckCircle2, MoreVertical } from 'lucide-react'

type Props = {
  subjectUserId: string
  subjectName: string
  subjectCurrentTitle: string
  teamId: string
}

type ActionState =
  | { success: true }
  | { errors: Record<string, string[]> }
  | { message: string }
  | undefined

export function LeadershipWorkflowButtons({ subjectUserId, subjectName, subjectCurrentTitle, teamId }: Props) {
  const [menu, setMenu] = useState(false)
  const [modal, setModal] = useState<'promotion' | 'salary' | null>(null)
  const [promoState, promoAction, promoPending] = useActionState(createPromotionRequest, undefined)
  const [salaryState, salaryAction, salaryPending] = useActionState(createSalaryHikeRequest, undefined)
  const [showSuccess, setShowSuccess] = useState(false)

  const ps = promoState as ActionState
  const ss = salaryState as ActionState

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

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setMenu((m) => !m)}
          onBlur={() => setTimeout(() => setMenu(false), 150)}
          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Workflow actions"
        >
          <MoreVertical size={16} />
        </button>
        {menu && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
            <button
              onMouseDown={() => { setModal('promotion'); setMenu(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
            >
              <TrendingUp size={14} /> Recommend Promotion
            </button>
            <button
              onMouseDown={() => { setModal('salary'); setMenu(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
            >
              <DollarSign size={14} /> Salary Hike
            </button>
          </div>
        )}
      </div>

      {/* Promotion Modal */}
      {modal === 'promotion' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recommend Promotion · {subjectName}</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-gray-400" /></button>
            </div>

            {showSuccess && ps && 'success' in ps ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 size={48} className="text-green-500 mb-3" />
                <p className="font-medium text-gray-900">Promotion request submitted</p>
                <p className="text-sm text-gray-500 mt-1">Sent to higher leadership for review.</p>
              </div>
            ) : (
              <form action={promoAction} className="space-y-3">
                <input type="hidden" name="subjectUserId" value={subjectUserId} />
                <input type="hidden" name="teamId" value={teamId} />

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Current Title</label>
                  <input name="currentTitle" defaultValue={subjectCurrentTitle} readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Proposed Title</label>
                  <input name="proposedTitle"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Senior Manager" />
                  {ps && 'errors' in ps && ps.errors.proposedTitle && (
                    <p className="text-xs text-red-500 mt-1">{ps.errors.proposedTitle[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Justification</label>
                  <textarea name="justification" rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Why does this person deserve a promotion? (at least 10 characters)" />
                  {ps && 'errors' in ps && ps.errors.justification && (
                    <p className="text-xs text-red-500 mt-1">{ps.errors.justification[0]}</p>
                  )}
                </div>
                {ps && 'message' in ps && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{ps.message}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setModal(null)}
                    className="flex-1 text-sm border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 transition-colors">
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recommend Salary Hike · {subjectName}</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-gray-400" /></button>
            </div>

            {showSuccess && ss && 'success' in ss ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 size={48} className="text-green-500 mb-3" />
                <p className="font-medium text-gray-900">Salary hike request submitted</p>
                <p className="text-sm text-gray-500 mt-1">Sent to higher leadership for review.</p>
              </div>
            ) : (
              <form action={salaryAction} className="space-y-3">
                <input type="hidden" name="subjectUserId" value={subjectUserId} />
                <input type="hidden" name="teamId" value={teamId} />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Current Salary ($)</label>
                    <input name="currentSalary" type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100000" />
                    {ss && 'errors' in ss && ss.errors.currentSalary && (
                      <p className="text-xs text-red-500 mt-1">{ss.errors.currentSalary[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Proposed Salary ($)</label>
                    <input name="proposedSalary" type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="115000" />
                    {ss && 'errors' in ss && ss.errors.proposedSalary && (
                      <p className="text-xs text-red-500 mt-1">{ss.errors.proposedSalary[0]}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Justification</label>
                  <textarea name="justification" rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Reason for the salary hike request… (at least 10 characters)" />
                  {ss && 'errors' in ss && ss.errors.justification && (
                    <p className="text-xs text-red-500 mt-1">{ss.errors.justification[0]}</p>
                  )}
                </div>
                {ss && 'message' in ss && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{ss.message}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setModal(null)}
                    className="flex-1 text-sm border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 transition-colors">
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
