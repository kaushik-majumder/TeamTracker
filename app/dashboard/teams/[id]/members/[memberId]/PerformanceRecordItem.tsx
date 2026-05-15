'use client'
import { deletePerformanceRecord } from '@/actions/employees'
import { format } from 'date-fns'
import { Trash2, Paperclip, Download } from 'lucide-react'
import { useTransition } from 'react'

type Attachment = {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  dataUrl: string
}

type Props = {
  id: string
  period: string
  rating: number
  notes: string
  authorName: string
  createdAt: Date
  attachments: Attachment[]
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

export function PerformanceRecordItem({ id, period, rating, notes, authorName, createdAt, attachments }: Props) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{period}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < rating ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}>★</span>
            ))}
          </div>
          <button
            onClick={() => {
              if (confirm(`Delete this performance record (${period})? Attachments will be removed too.`)) {
                startTransition(() => deletePerformanceRecord(id))
              }
            }}
            disabled={pending}
            title="Delete record"
            className="text-gray-400 dark:text-gray-500 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{notes}</p>

      {attachments.length > 0 && (
        <ul className="mt-2 space-y-1">
          {attachments.map((a) => (
            <li key={a.id}>
              <a
                href={a.dataUrl}
                download={a.filename}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2 py-1 rounded-lg transition-colors max-w-full"
                title={a.filename}
              >
                <Paperclip size={12} className="shrink-0" />
                <span className="truncate">{a.filename}</span>
                <span className="text-gray-400 dark:text-gray-500 shrink-0">{formatBytes(a.sizeBytes)}</span>
                <Download size={12} className="shrink-0 text-gray-400 dark:text-gray-500" />
              </a>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        by {authorName} · {format(createdAt, 'MMM d, yyyy')}
      </p>
    </div>
  )
}
