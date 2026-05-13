'use client'
import { useActionState } from 'react'
import { createTeam } from '@/actions/teams'
import Link from 'next/link'

export default function NewTeamPage() {
  const [state, action, pending] = useActionState(createTeam, undefined)

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/dashboard/teams" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to teams
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mt-2">Create Team</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
            <input
              name="name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Frontend Platform"
            />
            {state?.errors?.name && (
              <p className="text-xs text-red-500 mt-1">{state.errors.name[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="What does this team work on?"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            {pending ? 'Creating…' : 'Create Team'}
          </button>
        </form>
      </div>
    </div>
  )
}
