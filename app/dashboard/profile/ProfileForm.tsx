'use client'
import { useActionState, useState, useRef } from 'react'
import { updateProfile } from '@/actions/profile'
import { Avatar } from '@/components/Avatar'
import { Upload, X } from 'lucide-react'

type Props = {
  defaultName: string
  defaultEmail: string
  defaultGender: string | null
  defaultProfileImageUrl: string | null
}

const MAX_DIMENSION = 256

/** Resizes an image client-side to a 256px JPEG data URL to keep payloads small. */
async function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.onload = () => {
      const img = new window.Image()
      img.onerror = () => reject(new Error('Could not decode image'))
      img.onload = () => {
        const ratio = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height, 1)
        const w = Math.round(img.width * ratio)
        const h = Math.round(img.height * ratio)

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas not supported'))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function ProfileForm({
  defaultName,
  defaultEmail,
  defaultGender,
  defaultProfileImageUrl,
}: Props) {
  const [state, action, pending] = useActionState(updateProfile, undefined)
  const [name, setName] = useState(defaultName)
  const [imageUrl, setImageUrl] = useState<string | null>(defaultProfileImageUrl ?? null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const s = state as { errors?: Record<string, string[]>; message?: string; success?: boolean } | undefined

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)

    if (!file.type.startsWith('image/')) {
      setUploadError('Please pick an image file')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File too large (8MB max)')
      return
    }

    setUploading(true)
    try {
      const dataUrl = await resizeImage(file)
      setImageUrl(dataUrl)
    } catch (err) {
      setUploadError((err as Error).message || 'Failed to process image')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setImageUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <form action={action} className="space-y-5">
      {/* Avatar preview + upload */}
      <div className="flex items-start gap-4">
        <Avatar name={name || 'User'} imageUrl={imageUrl} size={80} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Image</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">PNG, JPG, or WebP. Resized to 256×256 automatically.</p>

          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
              <Upload size={14} />
              {imageUrl ? 'Change image' : 'Upload image'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {imageUrl && (
              <button
                type="button"
                onClick={removeImage}
                className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <X size={14} /> Remove
              </button>
            )}
          </div>

          {uploading && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Processing…</p>}
          {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
        </div>
      </div>

      <input type="hidden" name="profileImageUrl" value={imageUrl ?? ''} />
      {s?.errors?.profileImageUrl && (
        <p className="text-xs text-red-500">{s.errors.profileImageUrl[0]}</p>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {s?.errors?.name && <p className="text-xs text-red-500 mt-1">{s.errors.name[0]}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
        <input
          name="email"
          type="email"
          defaultValue={defaultEmail}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {s?.errors?.email && <p className="text-xs text-red-500 mt-1">{s.errors.email[0]}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Gender</label>
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
        disabled={pending || uploading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors"
      >
        {pending ? 'Saving…' : 'Save Profile'}
      </button>
    </form>
  )
}
