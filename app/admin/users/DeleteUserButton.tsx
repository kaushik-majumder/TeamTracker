'use client'
import { deleteUser } from '@/actions/admin'
import { Trash2 } from 'lucide-react'
import { useTransition } from 'react'

export function DeleteUserButton({ userId, name }: { userId: string; name: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => {
        if (confirm(`Delete user "${name}"? This cannot be undone.`)) {
          startTransition(() => deleteUser(userId))
        }
      }}
      disabled={pending}
      className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
      title="Delete user"
    >
      <Trash2 size={16} />
    </button>
  )
}
