'use client'
import { useActionState } from 'react'
import { reviewPromotionRequest, reviewSalaryHikeRequest } from '@/actions/workflows'

type Props = { requestId: string; type: 'promotion' | 'salary' }

export function ReviewForm({ requestId, type }: Props) {
  const action = type === 'promotion' ? reviewPromotionRequest : reviewSalaryHikeRequest
  const [, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="mt-4 pt-4 border-t border-gray-100 space-y-2">
      <input type="hidden" name="requestId" value={requestId} />
      <textarea
        name="reviewNote"
        rows={2}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        placeholder="Optional review note…"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          name="status"
          value="APPROVED"
          disabled={pending}
          className="text-sm bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
        >
          Approve
        </button>
        <button
          type="submit"
          name="status"
          value="REJECTED"
          disabled={pending}
          className="text-sm bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
        >
          Reject
        </button>
      </div>
    </form>
  )
}
