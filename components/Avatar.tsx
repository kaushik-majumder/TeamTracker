import Image from 'next/image'

type Props = {
  name: string
  imageUrl?: string | null
  size?: number
  className?: string
}

const PALETTE = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-purple-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-pink-500',
]

function hashColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ name, imageUrl, size = 32, className = '' }: Props) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        unoptimized
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size / 2.4 }}
      className={`rounded-full ${hashColor(name)} text-white flex items-center justify-center font-semibold ${className}`}
    >
      {initialsOf(name)}
    </div>
  )
}
