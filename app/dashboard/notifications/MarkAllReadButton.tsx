'use client'
import { markAllNotificationsRead } from '@/actions/notifications'
import { CheckCheck } from 'lucide-react'
import { useTransition } from 'react'

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition()
  return (
    <button
      onClick={() => startTransition(() => markAllNotificationsRead())}
      disabled={pending}
      className="flex items-center gap-1.5 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
    >
      <CheckCheck size={14} />
      {pending ? 'Marking…' : 'Mark all read'}
    </button>
  )
}
