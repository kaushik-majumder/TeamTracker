'use client'
import { useActionState } from 'react'
import { addEmployee } from '@/actions/employees'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function NewMemberPage() {
  const params = useParams<{ id: string }>()
  const [state, action, pending] = useActionState(addEmployee, undefined)

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href={`/dashboard/teams/${params.id}`} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-200">
          ← Back to team
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">Add Team Member</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <form action={action} className="space-y-4">
          <input type="hidden" name="teamId" value={params.id} />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Full Name</label>
            <input
              name="name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jane Smith"
            />
            {state?.errors?.name && <p className="text-xs text-red-500 mt-1">{state.errors.name[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
            <input
              name="email"
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="jane@company.com"
            />
            {state?.errors?.email && <p className="text-xs text-red-500 mt-1">{state.errors.email[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Designation</label>
            <input
              name="title"
              list="designation-options"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Senior Developer"
            />
            <datalist id="designation-options">
              <option value="Junior Developer" />
              <option value="Mid-level Developer" />
              <option value="Senior Developer" />
              <option value="Staff Engineer" />
              <option value="Principal Engineer" />
              <option value="QA Engineer" />
              <option value="Product Designer" />
              <option value="Product Manager" />
              <option value="Engineering Manager" />
            </datalist>
            {state?.errors?.title && <p className="text-xs text-red-500 mt-1">{state.errors.title[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Join Date</label>
            <input
              name="joinDate"
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {state?.errors?.joinDate && (
              <p className="text-xs text-red-500 mt-1">{state.errors.joinDate[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            {pending ? 'Adding…' : 'Add Member'}
          </button>
        </form>
      </div>
    </div>
  )
}
