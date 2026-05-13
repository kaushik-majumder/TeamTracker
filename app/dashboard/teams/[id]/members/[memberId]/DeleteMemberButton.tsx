'use client'
import { deleteEmployee } from '@/actions/employees'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'

type Props = { employeeId: string; teamId: string; name: string }

export function DeleteMemberButton({ employeeId, teamId, name }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => {
        if (confirm(`Delete ${name}? All performance records and workflow history for this member will be removed. This cannot be undone.`)) {
          startTransition(async () => {
            await deleteEmployee(employeeId)
            router.push(`/dashboard/teams/${teamId}`)
          })
        }
      }}
      disabled={pending}
      className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
    >
      <Trash2 size={14} />
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
