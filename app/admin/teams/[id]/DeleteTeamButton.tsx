'use client'
import { deleteTeam } from '@/actions/admin'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'

export function DeleteTeamButton({ teamId, name }: { teamId: string; name: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => {
        if (confirm(`Delete team "${name}"? All employees and history will be deleted.`)) {
          startTransition(async () => {
            await deleteTeam(teamId)
            router.push('/admin/teams')
          })
        }
      }}
      disabled={pending}
      className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
    >
      <Trash2 size={14} /> Delete Team
    </button>
  )
}
