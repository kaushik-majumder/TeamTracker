'use client'
import { useState, useActionState } from 'react'
import { createPromotionRequest, createSalaryHikeRequest } from '@/actions/workflows'
import { TrendingUp, DollarSign, X } from 'lucide-react'
import { Role } from '@prisma/client'

type Props = {
  employeeId: string
  teamId: string
  currentTitle: string
  role: Role
}

export function WorkflowButtons({ employeeId, teamId, currentTitle, role }: Props) {
  const [modal, setModal] = useState<'promotion' | 'salary' | null>(null)
  const [promoState, promoAction, promoPending] = useActionState(createPromotionRequest, undefined)
  const [salaryState, salaryAction, salaryPending] = useActionState(createSalaryHikeRequest, undefined)

  if (role === 'MANAGER') return null

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setModal('promotion')}
          className="flex items-center gap-1.5 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <TrendingUp size={14} />
          Recommend Promotion
        </button>
        <button
          onClick={() => setModal('salary')}
          className="flex items-center gap-1.5 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <DollarSign size={14} />
          Salary Hike
        </button>
      </div>

      {/* Promotion Modal */}
      {modal === 'promotion' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recommend Promotion</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form action={async (fd) => { await promoAction(fd); if (!(promoState as {errors?: unknown})?.errors) setModal(null) }} className="space-y-3">
              <input type="hidden" name="employeeId" value={employeeId} />
              <input type="hidden" name="teamId" value={teamId} />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Current Title</label>
                <input name="currentTitle" defaultValue={currentTitle} readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Proposed Title</label>
                <input name="proposedTitle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Senior Engineer" />
                {(promoState as {errors?: {proposedTitle?: string[]}})?.errors?.proposedTitle && (
                  <p className="text-xs text-red-500 mt-1">{(promoState as {errors?: {proposedTitle?: string[]}})?.errors?.proposedTitle![0]}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Justification</label>
                <textarea name="justification" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Why does this person deserve a promotion?" />
                {(promoState as {errors?: {justification?: string[]}})?.errors?.justification && (
                  <p className="text-xs text-red-500 mt-1">{(promoState as {errors?: {justification?: string[]}})?.errors?.justification![0]}</p>
                )}
              </div>
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
          </div>
        </div>
      )}

      {/* Salary Hike Modal */}
      {modal === 'salary' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recommend Salary Hike</h3>
              <button onClick={() => setModal(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form action={async (fd) => { await salaryAction(fd); if (!(salaryState as {errors?: unknown})?.errors) setModal(null) }} className="space-y-3">
              <input type="hidden" name="employeeId" value={employeeId} />
              <input type="hidden" name="teamId" value={teamId} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Current Salary ($)</label>
                  <input name="currentSalary" type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="80000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Proposed Salary ($)</label>
                  <input name="proposedSalary" type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="90000" />
                </div>
              </div>
              {(salaryState as {errors?: {currentSalary?: string[]}})?.errors?.currentSalary && (
                <p className="text-xs text-red-500">{(salaryState as {errors?: {currentSalary?: string[]}})?.errors?.currentSalary![0]}</p>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Justification</label>
                <textarea name="justification" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Reason for the salary hike request…" />
                {(salaryState as {errors?: {justification?: string[]}})?.errors?.justification && (
                  <p className="text-xs text-red-500 mt-1">{(salaryState as {errors?: {justification?: string[]}})?.errors?.justification![0]}</p>
                )}
              </div>
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
          </div>
        </div>
      )}
    </>
  )
}
