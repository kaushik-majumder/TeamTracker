'use client'
import { useActionState, useState, useEffect } from 'react'
import { createUser } from '@/actions/admin'

type Props = { teams: { id: string; name: string }[] }

const DESIGNATION_SUGGESTIONS = [
  'Junior Developer',
  'Mid-level Developer',
  'Senior Developer',
  'Staff Engineer',
  'Principal Engineer',
  'QA Engineer',
  'Product Designer',
  'Product Manager',
  'Engineering Manager',
]

type Role = 'MANAGING_DIRECTOR' | 'MANAGER' | 'TEAM_LEAD' | 'TEAM_MEMBER'

export function CreateUserForm({ teams }: Props) {
  const [state, action, pending] = useActionState(createUser, undefined)
  const [role, setRole] = useState<Role>('MANAGER')
  const [teamMode, setTeamMode] = useState<'none' | 'existing' | 'new'>('none')
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [addNewTeam, setAddNewTeam] = useState(false)
  const s = state as { errors?: Record<string, string[]>; message?: string; success?: boolean } | undefined

  const isMember = role === 'TEAM_MEMBER'
  const isMultiTeam = role === 'MANAGER' || role === 'MANAGING_DIRECTOR'

  // Team members must always have a team assigned (single)
  useEffect(() => {
    if (isMember && teamMode === 'none') {
      setTeamMode(teams.length > 0 ? 'existing' : 'new')
    }
  }, [isMember, teamMode, teams.length])

  useEffect(() => {
    if (s?.success) {
      setRole('MANAGER')
      setTeamMode('none')
      setSelectedTeamIds([])
      setAddNewTeam(false)
    }
  }, [s?.success])

  const toggleTeam = (id: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

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
        <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="MANAGING_DIRECTOR">Managing Director</option>
          <option value="MANAGER">Manager</option>
          <option value="TEAM_LEAD">Team Lead</option>
          <option value="TEAM_MEMBER">Team Member</option>
        </select>
        <p className="text-[11px] text-gray-400 mt-1">
          {isMember
            ? 'Team members do not log in — they are tracked records only.'
            : isMultiTeam
              ? 'Can be assigned to multiple teams.'
              : 'Admin role is reserved and cannot be assigned.'}
        </p>
      </div>

      {!isMember && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
          <input name="password" type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="At least 6 characters" />
          {s?.errors?.password && <p className="text-xs text-red-500 mt-1">{s.errors.password[0]}</p>}
        </div>
      )}

      {isMember && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Designation</label>
            <input
              name="designation"
              list="designation-options"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Senior Developer"
            />
            <datalist id="designation-options">
              {DESIGNATION_SUGGESTIONS.map((d) => <option key={d} value={d} />)}
            </datalist>
            {s?.errors?.designation && <p className="text-xs text-red-500 mt-1">{s.errors.designation[0]}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Join Date</label>
            <input name="joinDate" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {s?.errors?.joinDate && <p className="text-xs text-red-500 mt-1">{s.errors.joinDate[0]}</p>}
          </div>
        </>
      )}

      {/* Team assignment */}
      <div className="pt-3 border-t border-gray-100">
        {/* MULTI-TEAM MODE for Manager / MD */}
        {isMultiTeam ? (
          <>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Assign to Teams <span className="text-gray-400 font-normal">(pick any number)</span>
            </label>

            {teams.length === 0 ? (
              <p className="text-xs text-gray-500 mb-2">No teams exist yet — create one below.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1 mb-3">
                {teams.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="selectedTeamIds"
                      value={t.id}
                      checked={selectedTeamIds.includes(t.id)}
                      onChange={() => toggleTeam(t.id)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{t.name}</span>
                  </label>
                ))}
              </div>
            )}

            <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={addNewTeam}
                onChange={(e) => setAddNewTeam(e.target.checked)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Also create a new team</span>
            </label>

            {addNewTeam && (
              <div className="space-y-2 pl-6">
                <input
                  name="newTeamName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="New team name"
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

            {selectedTeamIds.length === 0 && !addNewTeam && (
              <p className="text-[11px] text-gray-400 mt-2">
                No teams selected — user can be assigned later from Manage Teams.
              </p>
            )}
          </>
        ) : (
          /* SINGLE-TEAM MODE for Team Lead / Team Member */
          <>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Team Assignment {isMember && <span className="text-red-500">*</span>}
            </label>
            <input type="hidden" name="teamMode" value={teamMode} />

            <div className="space-y-2 mb-3">
              {(['none', 'existing', 'new'] as const).map((mode) => {
                if (mode === 'none' && isMember) return null
                return (
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
                )
              })}
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
            {s?.errors?.teamMode && <p className="text-xs text-red-500 mt-1">{s.errors.teamMode[0]}</p>}
          </>
        )}
      </div>

      {s?.message && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{s.message}</p>}
      {s?.success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">Created successfully.</p>}

      <button type="submit" disabled={pending} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
        {pending ? 'Creating…' : isMember ? 'Add Team Member' : 'Create User'}
      </button>
    </form>
  )
}
