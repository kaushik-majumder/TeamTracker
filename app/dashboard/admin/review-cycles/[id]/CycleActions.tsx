'use client'
import { openReviewCycle, closeReviewCycle, deleteReviewCycle } from '@/actions/reviewCycles'
import { CycleStatus } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { Play, Lock, Trash2 } from 'lucide-react'

export function CycleActions({ cycleId, status }: { cycleId: string; status: CycleStatus }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="flex gap-2 flex-wrap">
      {status === 'DRAFT' && (
        <button
          onClick={() => {
            if (confirm('Open this cycle? Reviewers will be auto-assigned and notified.')) {
              startTransition(async () => {
                const res = await openReviewCycle(cycleId)
                if (res?.message) setMessage(res.message)
                else if (res?.success) setMessage(`Opened — ${res.opened} review${res.opened === 1 ? '' : 's'} created`)
              })
            }
          }}
          disabled={pending}
          className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Play size={14} /> {pending ? 'Opening…' : 'Open Cycle'}
        </button>
      )}

      {status === 'OPEN' && (
        <button
          onClick={() => {
            if (confirm('Close this cycle? Reviewers can no longer submit.')) {
              startTransition(async () => {
                const res = await closeReviewCycle(cycleId)
                if (res?.message) setMessage(res.message)
              })
            }
          }}
          disabled={pending}
          className="flex items-center gap-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <Lock size={14} /> {pending ? 'Closing…' : 'Close Cycle'}
        </button>
      )}

      {(status === 'DRAFT' || status === 'CLOSED') && (
        <button
          onClick={() => {
            if (confirm('Delete this cycle and all its reviews? This cannot be undone.')) {
              startTransition(async () => {
                await deleteReviewCycle(cycleId)
                router.push('/dashboard/admin/review-cycles')
              })
            }
          }}
          disabled={pending}
          className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} /> Delete
        </button>
      )}

      {message && <span className="text-xs text-gray-500 dark:text-gray-300 self-center">{message}</span>}
    </div>
  )
}
