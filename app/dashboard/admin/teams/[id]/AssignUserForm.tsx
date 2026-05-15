'use client'
import { useActionState } from 'react'
import { assignUserToTeam } from '@/actions/admin'

type Props = { teamId: string; users: { id: string; name: string; role: string }[] }

export function AssignUserForm({ teamId, users }: Props) {
  const [state, action, pending] = useActionState(assignUserToTeam, undefined)
  const s = state as { errors?: Record<string, string[]>; success?: boolean } | undefined

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="teamId" value={teamId} />
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">User</label>
        <select name="userId" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {users.map((u) => {
            const label =
              u.role === 'MANAGING_DIRECTOR' ? 'Managing Director' :
              u.role === 'MANAGER' ? 'Manager' :
              u.role === 'TEAM_LEAD' ? 'Team Lead' : u.role
            return <option key={u.id} value={u.id}>{u.name} ({label})</option>
          })}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Role on this Team</label>
        <select name="role" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="MANAGING_DIRECTOR">Managing Director</option>
          <option value="MANAGER">Manager</option>
          <option value="TEAM_LEAD">Team Lead</option>
        </select>
        <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">The user&apos;s base role can differ from their per-team role.</p>
      </div>
      {s?.success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">Access granted.</p>}
      <button type="submit" disabled={pending} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
        {pending ? 'Assigning…' : 'Assign'}
      </button>
    </form>
  )
}
