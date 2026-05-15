'use client'
import { useState, useActionState, useEffect } from 'react'
import { updateEmployee } from '@/actions/employees'
import { Pencil, X } from 'lucide-react'

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

type Props = {
  employeeId: string
  defaultName: string
  defaultEmail: string
  defaultTitle: string
  defaultJoinDate: string
}

export function EditMemberButton({ employeeId, defaultName, defaultEmail, defaultTitle, defaultJoinDate }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(updateEmployee, undefined)
  const s = state as { errors?: Record<string, string[]>; success?: boolean } | undefined

  useEffect(() => {
    if (s?.success) setOpen(false)
  }, [s?.success])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 font-medium px-3 py-2 rounded-lg transition-colors"
      >
        <Pencil size={14} /> Edit
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Edit Team Member</h3>
              <button onClick={() => setOpen(false)}><X size={18} className="text-gray-400 dark:text-gray-500" /></button>
            </div>

            <form action={action} className="space-y-3">
              <input type="hidden" name="employeeId" value={employeeId} />

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
                <input name="name" defaultValue={defaultName} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {s?.errors?.name && <p className="text-xs text-red-500 mt-1">{s.errors.name[0]}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                <input name="email" type="email" defaultValue={defaultEmail} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {s?.errors?.email && <p className="text-xs text-red-500 mt-1">{s.errors.email[0]}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Designation</label>
                <input name="title" defaultValue={defaultTitle} list="edit-designation-options" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <datalist id="edit-designation-options">
                  {DESIGNATION_SUGGESTIONS.map((d) => <option key={d} value={d} />)}
                </datalist>
                {s?.errors?.title && <p className="text-xs text-red-500 mt-1">{s.errors.title[0]}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Join Date</label>
                <input name="joinDate" type="date" defaultValue={defaultJoinDate} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {s?.errors?.joinDate && <p className="text-xs text-red-500 mt-1">{s.errors.joinDate[0]}</p>}
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm border border-gray-300 text-gray-600 dark:text-gray-400 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors">
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
