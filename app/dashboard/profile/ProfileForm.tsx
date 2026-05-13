'use client'
import { useActionState, useState } from 'react'
import { updateProfile } from '@/actions/profile'
import { Avatar } from '@/components/Avatar'

type Props = {
  defaultName: string
  defaultEmail: string
  defaultGender: string | null
  defaultProfileImageUrl: string | null
}

export function ProfileForm({
  defaultName,
  defaultEmail,
  defaultGender,
  defaultProfileImageUrl,
}: Props) {
  const [state, action, pending] = useActionState(updateProfile, undefined)
  const [name, setName] = useState(defaultName)
  const [imageUrl, setImageUrl] = useState(defaultProfileImageUrl ?? '')
  const s = state as { errors?: Record<string, string[]>; message?: string; success?: boolean } | undefined

  return (
    <form action={action} className="space-y-5">
      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        <Avatar name={name || 'User'} imageUrl={imageUrl || null} size={72} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700">Profile Image</p>
          <p className="text-xs text-gray-500">Paste an image URL or leave blank to use initials.</p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Profile Image URL</label>
        <input
          name="profileImageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {s?.errors?.profileImageUrl && (
          <p className="text-xs text-red-500 mt-1">{s.errors.profileImageUrl[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
        <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
        <select
          name="gender"
          defaultValue={defaultGender ?? ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Prefer not to say</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {s?.message && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{s.message}</p>}
      {s?.success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">Profile updated.</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors"
      >
        {pending ? 'Saving…' : 'Save Profile'}
      </button>
    </form>
  )
}
