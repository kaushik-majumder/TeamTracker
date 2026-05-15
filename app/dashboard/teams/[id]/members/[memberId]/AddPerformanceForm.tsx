'use client'
import { useActionState, useRef, useState, useEffect } from 'react'
import { addPerformanceRecord } from '@/actions/employees'
import { Paperclip, X } from 'lucide-react'

type Props = { employeeId: string; teamId: string }

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

export function AddPerformanceForm({ employeeId }: Props) {
  const [state, action, pending] = useActionState(addPerformanceRecord, undefined)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const s = state as { errors?: Record<string, string[]>; message?: string; success?: boolean } | undefined

  // After a successful submit, reset the file picker too
  useEffect(() => {
    if (s?.success) {
      setFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      formRef.current?.reset()
    }
  }, [s?.success])

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? [])
    if (incoming.length === 0) return
    setFiles((prev) => [...prev, ...incoming])
    // Clear native input so the same file can be picked again later if removed
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const remove = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="employeeId" value={employeeId} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Period</label>
          <input
            name="period"
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Q1 2025"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Rating (1–5)</label>
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
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Notes</label>
        <textarea
          name="notes"
          rows={2}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Performance summary…"
        />
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
          Attachments <span className="text-gray-400 dark:text-gray-400 font-normal">(optional, max 3MB each)</span>
        </label>

        {files.length > 0 && (
          <ul className="space-y-1 mb-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800/50 rounded-lg px-2 py-1.5">
                <span className="truncate flex-1 text-gray-700 dark:text-gray-200">{f.name}</span>
                <span className="text-gray-400 dark:text-gray-400 ml-2">{formatBytes(f.size)}</span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="ml-2 text-gray-400 dark:text-gray-400 hover:text-red-600"
                  aria-label={`Remove ${f.name}`}
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className="inline-flex items-center gap-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 font-medium px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors">
          <Paperclip size={12} />
          {files.length === 0 ? 'Add files' : 'Add more'}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={onPick}
            className="hidden"
          />
        </label>

        {/* Carry the actual files in named hidden inputs the form submits */}
        {files.map((f, i) => (
          <FileSlot key={i} file={f} />
        ))}
      </div>

      {s?.message && <p className="text-xs text-red-500">{s.message}</p>}

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

/**
 * React file inputs are uncontrolled — we can't drive their value from state.
 * To submit the in-state list, we render a hidden file input per file and
 * use the DataTransfer API to put the right File on each one before submit.
 */
function FileSlot({ file }: { file: File }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const dt = new DataTransfer()
    dt.items.add(file)
    ref.current.files = dt.files
  }, [file])
  return <input ref={ref} type="file" name="attachments" className="hidden" />
}
