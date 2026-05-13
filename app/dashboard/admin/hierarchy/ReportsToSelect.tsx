'use client'
import { useActionState, useEffect, useState } from 'react'
import { setReportsTo } from '@/actions/hierarchy'

type Props = {
  userId: string
  currentReportsToId: string | null
  candidates: { id: string; label: string }[]
}

export function ReportsToSelect({ userId, currentReportsToId, candidates }: Props) {
  const [state, action, pending] = useActionState(setReportsTo, undefined)
  const [value, setValue] = useState<string>(currentReportsToId ?? '')
  const [flash, setFlash] = useState<'saved' | null>(null)
  const s = state as { success?: boolean; message?: string; errors?: Record<string, string[]> } | undefined

  useEffect(() => {
    if (s?.success) {
      setFlash('saved')
      const t = setTimeout(() => setFlash(null), 1500)
      return () => clearTimeout(t)
    }
  }, [s?.success])

  // Auto-submit when the dropdown value changes
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value
    setValue(next)
    const form = e.target.form
    if (form) form.requestSubmit()
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="reportsToId"
        value={value}
        onChange={handleChange}
        disabled={pending || candidates.length === 0}
        className="text-sm px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 min-w-[200px]"
      >
        <option value="">— No supervisor —</option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>{c.label}</option>
        ))}
      </select>
      {pending && <span className="text-xs text-gray-400">Saving…</span>}
      {flash === 'saved' && !pending && <span className="text-xs text-green-600">✓ Saved</span>}
      {s?.message && !pending && <span className="text-xs text-red-500">{s.message}</span>}
    </form>
  )
}
