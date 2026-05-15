'use client'
import { useState, useTransition } from 'react'
import { markEmployeeAsLeft, reactivateEmployee } from '@/actions/employees'
import { X, UserMinus, UserCheck } from 'lucide-react'
import { EmployeeStatus } from '@prisma/client'

type Props = { employeeId: string; status: EmployeeStatus }

export function EmployeeStatusButton({ employeeId, status }: Props) {
  const [open, setOpen] = useState(false)
  const [leftDate, setLeftDate] = useState(new Date().toISOString().split('T')[0])
  const [pending, startTransition] = useTransition()

  if (status === 'LEFT') {
    return (
      <button
        onClick={() => {
          if (confirm('Reactivate this employee? They will start receiving anniversary emails again.')) {
            startTransition(() => reactivateEmployee(employeeId))
          }
        }}
        disabled={pending}
        className="flex items-center gap-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        <UserCheck size={14} />
        Reactivate
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-gray-700 dark:text-gray-300 font-medium px-3 py-2 rounded-lg transition-colors"
      >
        <UserMinus size={14} />
        Mark as Left
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Mark Employee as Left</h3>
              <button onClick={() => setOpen(false)}><X size={18} className="text-gray-400 dark:text-gray-500" /></button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Their data will remain for reference, but they won&apos;t receive anniversary emails or appear in pending workflows.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Last Working Day</label>
              <input
                type="date"
                value={leftDate}
                onChange={(e) => setLeftDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 text-sm border border-gray-300 text-gray-600 dark:text-gray-400 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  startTransition(async () => {
                    await markEmployeeAsLeft(employeeId, leftDate)
                    setOpen(false)
                  })
                }}
                disabled={pending}
                className="flex-1 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {pending ? 'Marking…' : 'Mark as Left'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
