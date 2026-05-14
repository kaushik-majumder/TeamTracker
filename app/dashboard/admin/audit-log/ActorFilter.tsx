'use client'
import { useRouter, useSearchParams } from 'next/navigation'

type Props = { users: { id: string; name: string }[]; current: string | undefined }

export function ActorFilter({ users, current }: Props) {
  const router = useRouter()
  const params = useSearchParams()

  return (
    <select
      defaultValue={current ?? ''}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString())
        next.delete('page') // reset to first page on filter change
        if (e.target.value) next.set('actor', e.target.value)
        else next.delete('actor')
        router.push(`?${next.toString()}`)
      }}
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
    >
      <option value="">— Anyone —</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>{u.name}</option>
      ))}
    </select>
  )
}
