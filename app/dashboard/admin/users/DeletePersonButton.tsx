'use client'
import { deleteUser } from '@/actions/admin'
import { deleteEmployee } from '@/actions/employees'
import { Trash2 } from 'lucide-react'
import { useTransition } from 'react'

type Props = { id: string; name: string; kind: 'user' | 'employee' }

export function DeletePersonButton({ id, name, kind }: Props) {
  const [pending, startTransition] = useTransition()
  const action = kind === 'user' ? deleteUser : deleteEmployee
  const label = kind === 'user' ? 'user' : 'team member'

  return (
    <button
      onClick={() => {
        if (confirm(`Delete ${label} "${name}"? This cannot be undone.`)) {
          startTransition(() => action(id))
        }
      }}
      disabled={pending}
      className="text-gray-400 dark:text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
      title={`Delete ${label}`}
    >
      <Trash2 size={16} />
    </button>
  )
}
