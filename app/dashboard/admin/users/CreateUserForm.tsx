'use client'
import { useActionState, useState, useEffect } from 'react'
import { createUser } from '@/actions/admin'

type Props = { teams: { id: string; name: string }[] }

export function CreateUserForm({ teams }: Props) {
  const [state, action, pending] = useActionState(createUser, undefined)
  const [teamMode, setTeamMode] = useState<'none' | 'existing' | 'new'>('none')
  const s = state as { errors?: Record<string, string[]>; message?: string; success?: boolean } | undefined

  useEffect(() => {
    if (s?.success) setTeamMode('none')
  }, [s?.success])

  return (
    <form action={action} className="space-y-3" key={s?.success ? 'reset' : 'form'}>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
        <input name="name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Jane Doe" />
        {s?.errors?.name && <p className="text-xs text-red-500 mt-1">{s.errors.name[0]}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
        <input name="email" type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="jane@company.com" />
        {s?.errors?.email && <p className="text-xs text-red-500 mt-1">{s.errors.email[0]}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
        <input name="password" type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="At least 6 characters" />
        {s?.errors?.password && <p className="text-xs text-red-500 mt-1">{s.errors.password[0]}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
        <select name="role" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="MANAGER">Manager</option>
          <option value="TEAM_LEAD">Team Lead</option>
        </select>
        <p className="text-[11px] text-gray-400 mt-1">Admin role is reserved and cannot be assigned.</p>
      </div>

      <div className="pt-3 border-t border-gray-100">
        <label className="block text-xs font-medium text-gray-600 mb-2">Team Assignment</label>
        <input type="hidden" name="teamMode" value={teamMode} />

        <div className="space-y-2 mb-3">
          {(['none', 'existing', 'new'] as const).map((mode) => (
            <label key={mode} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                checked={teamMode === mode}
                onChange={() => setTeamMode(mode)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">
                {mode === 'none' && 'Skip — assign later'}
                {mode === 'existing' && 'Assign to existing team'}
                {mode === 'new' && 'Create a new team'}
              </span>
            </label>
          ))}
        </div>

        {teamMode === 'existing' && (
          <div>
            {teams.length === 0 ? (
              <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                No teams exist yet — pick &quot;Create a new team&quot; instead.
              </p>
            ) : (
              <select name="existingTeamId" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            {s?.errors?.existingTeamId && <p className="text-xs text-red-500 mt-1">{s.errors.existingTeamId[0]}</p>}
          </div>
        )}

        {teamMode === 'new' && (
          <div className="space-y-2">
            <input
              name="newTeamName"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Team name (e.g. Mobile Platform)"
            />
            {s?.errors?.newTeamName && <p className="text-xs text-red-500 mt-1">{s.errors.newTeamName[0]}</p>}
            <textarea
              name="newTeamDescription"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Description (optional)"
            />
          </div>
        )}
      </div>

      {s?.message && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{s.message}</p>}
      {s?.success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">User created.</p>}

      <button type="submit" disabled={pending} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
        {pending ? 'Creating…' : 'Create User'}
      </button>
    </form>
  )
}
