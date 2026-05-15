'use client'
import { useActionState, useState, useEffect } from 'react'
import { createReviewCycle } from '@/actions/reviewCycles'

type Props = { teams: { id: string; name: string }[] }

export function CreateCycleForm({ teams }: Props) {
  const [state, action, pending] = useActionState(createReviewCycle, undefined)
  const [scope, setScope] = useState<'ALL' | 'SELECTED'>('ALL')
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const s = state as { errors?: Record<string, string[]>; message?: string; success?: boolean } | undefined

  useEffect(() => {
    if (s?.success) {
      setScope('ALL')
      setSelectedTeamIds([])
    }
  }, [s?.success])

  const toggle = (id: string) =>
    setSelectedTeamIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))

  return (
    <form action={action} className="space-y-3" key={s?.success ? 'reset' : 'form'}>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cycle Name</label>
        <input
          name="name"
          placeholder="Q1 2026"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {s?.errors?.name && <p className="text-xs text-red-500 mt-1">{s.errors.name[0]}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Description <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          name="description"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start</label>
          <input
            name="startDate"
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {s?.errors?.startDate && <p className="text-xs text-red-500 mt-1">{s.errors.startDate[0]}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End</label>
          <input
            name="endDate"
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {s?.errors?.endDate && <p className="text-xs text-red-500 mt-1">{s.errors.endDate[0]}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Scope</label>
        <input type="hidden" name="scope" value={scope} />
        <div className="space-y-2 mb-2">
          {(['ALL', 'SELECTED'] as const).map((mode) => (
            <label key={mode} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                checked={scope === mode}
                onChange={() => setScope(mode)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">{mode === 'ALL' ? 'All teams' : 'Specific teams'}</span>
            </label>
          ))}
        </div>

        {scope === 'SELECTED' && (
          <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-lg p-2 space-y-1">
            {teams.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 p-2">No teams yet — create teams first.</p>
            ) : (
              teams.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50">
                  <input
                    type="checkbox"
                    name="selectedTeamIds"
                    value={t.id}
                    checked={selectedTeamIds.includes(t.id)}
                    onChange={() => toggle(t.id)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{t.name}</span>
                </label>
              ))
            )}
            {s?.errors?.selectedTeamIds && (
              <p className="text-xs text-red-500 mt-1">{s.errors.selectedTeamIds[0]}</p>
            )}
          </div>
        )}
      </div>

      {s?.message && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{s.message}</p>}
      {s?.success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">Cycle created.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
      >
        {pending ? 'Creating…' : 'Create Cycle'}
      </button>
    </form>
  )
}
