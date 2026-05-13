'use client'
import { useActionState } from 'react'
import { addPerformanceRecord } from '@/actions/employees'

type Props = { employeeId: string; teamId: string }

export function AddPerformanceForm({ employeeId, teamId }: Props) {
  const [state, action, pending] = useActionState(addPerformanceRecord, undefined)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="employeeId" value={employeeId} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Period</label>
          <input
            name="period"
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Q1 2025"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rating (1–5)</label>
          <select
            name="rating"
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
        <textarea
          name="notes"
          rows={2}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Performance summary…"
        />
      </div>

      {(state as { message?: string })?.message && (
        <p className="text-xs text-red-500">{(state as { message?: string }).message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="text-sm bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        {pending ? 'Saving…' : 'Add Record'}
      </button>
    </form>
  )
}
