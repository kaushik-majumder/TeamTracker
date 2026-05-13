'use client'
import { useActionState } from 'react'
import { createUser } from '@/actions/admin'

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUser, undefined)
  const s = state as { errors?: Record<string, string[]>; message?: string; success?: boolean } | undefined

  return (
    <form action={action} className="space-y-3">
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
        <input name="password" type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {s?.errors?.password && <p className="text-xs text-red-500 mt-1">{s.errors.password[0]}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
        <select name="role" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="MANAGER">Manager</option>
          <option value="TEAM_LEAD">Team Lead</option>
        </select>
      </div>
      {s?.message && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{s.message}</p>}
      {s?.success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">User created.</p>}
      <button type="submit" disabled={pending} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
        {pending ? 'Creating…' : 'Create User'}
      </button>
    </form>
  )
}
