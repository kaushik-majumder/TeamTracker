'use client'
import { removeUserFromTeam } from '@/actions/admin'
import { X } from 'lucide-react'
import { useTransition } from 'react'

export function RemoveAccessButton({ teamId, userId }: { teamId: string; userId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      onClick={() => {
        if (confirm('Remove this user from the team?')) {
          startTransition(() => removeUserFromTeam(teamId, userId))
        }
      }}
      disabled={pending}
      className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50 disabled:opacity-50"
      title="Remove"
    >
      <X size={14} />
    </button>
  )
}
