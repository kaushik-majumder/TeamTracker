'use client'
import { resyncHierarchyAccess } from '@/actions/hierarchy'
import { RefreshCw } from 'lucide-react'
import { useState, useTransition } from 'react'

export function SyncAccessButton() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => {
          startTransition(async () => {
            const res = await resyncHierarchyAccess()
            if (res?.success) {
              setResult(
                res.granted > 0
                  ? `Granted ${res.granted} new team access row${res.granted === 1 ? '' : 's'}`
                  : 'Everyone is already in sync'
              )
              setTimeout(() => setResult(null), 4000)
            }
          })
        }}
        disabled={pending}
        className="flex items-center gap-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        <RefreshCw size={14} className={pending ? 'animate-spin' : ''} />
        {pending ? 'Syncing…' : 'Sync access from hierarchy'}
      </button>
      {result && <span className="text-xs text-green-600">{result}</span>}
    </div>
  )
}
