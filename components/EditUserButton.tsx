'use client'
import { useState, useActionState, useEffect } from 'react'
import { updateUser } from '@/actions/users'
import { Pencil, X } from 'lucide-react'

type Props = {
  userId: string
  defaultName: string
  defaultEmail: string
  /** Display variant: 'icon' for compact icon-only, 'menu' for dropdown menu item */
  variant?: 'icon' | 'menu'
}

type State = { success?: boolean; errors?: Record<string, string[]>; message?: string } | undefined

export function EditUserButton({ userId, defaultName, defaultEmail, variant = 'icon' }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(updateUser, undefined)
  const s = state as State

  useEffect(() => {
    if (s?.success) setOpen(false)
  }, [s?.success])

  const trigger =
    variant === 'icon' ? (
      <button
        onClick={() => setOpen(true)}
        className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-blue-50"
        title="Edit user"
      >
        <Pencil size={16} />
      </button>
    ) : (
      <button
        onMouseDown={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
      >
        <Pencil size={14} /> Edit details
      </button>
    )

  return (
    <>
      {trigger}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Edit User</h3>
              <button onClick={() => setOpen(false)}><X size={18} className="text-gray-400" /></button>
            </div>

            <form action={action} className="space-y-3">
              <input type="hidden" name="userId" value={userId} />

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <input
                  name="name"
                  defaultValue={defaultName}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {s?.errors?.name && <p className="text-xs text-red-500 mt-1">{s.errors.name[0]}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={defaultEmail}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {s?.errors?.email && <p className="text-xs text-red-500 mt-1">{s.errors.email[0]}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                </label>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="At least 6 characters"
                />
                {s?.errors?.password && <p className="text-xs text-red-500 mt-1">{s.errors.password[0]}</p>}
              </div>

              {s?.message && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{s.message}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-sm border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors"
                >
                  {pending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
