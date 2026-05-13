'use client'
import { useActionState } from 'react'
import { adminCreateTeam } from '@/actions/admin'

export function CreateTeamForm() {
  const [state, action, pending] = useActionState(adminCreateTeam, undefined)
  const s = state as { errors?: Record<string, string[]>; success?: boolean } | undefined

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Team Name</label>
        <input name="name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Platform Engineering" />
        {s?.errors?.name && <p className="text-xs text-red-500 mt-1">{s.errors.name[0]}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
        <textarea name="description" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Optional" />
      </div>
      {s?.success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">Team created.</p>}
      <button type="submit" disabled={pending} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
        {pending ? 'Creating…' : 'Create Team'}
      </button>
    </form>
  )
}
