/**
 * Deterministic color palette for team cards. Each team gets a consistent
 * accent color based on a hash of its name, so the same team looks the
 * same everywhere it's listed.
 *
 * Classes are listed as full string literals so Tailwind's JIT picks
 * them up at build time.
 */
const PALETTE = [
  {
    border: 'border-blue-200',
    accent: 'bg-blue-500',
    soft: 'bg-blue-50',
    text: 'text-blue-700',
    hoverShadow: 'hover:shadow-blue-500/10',
  },
  {
    border: 'border-emerald-200',
    accent: 'bg-emerald-500',
    soft: 'bg-emerald-50',
    text: 'text-emerald-700',
    hoverShadow: 'hover:shadow-emerald-500/10',
  },
  {
    border: 'border-amber-200',
    accent: 'bg-amber-500',
    soft: 'bg-amber-50',
    text: 'text-amber-700',
    hoverShadow: 'hover:shadow-amber-500/10',
  },
  {
    border: 'border-rose-200',
    accent: 'bg-rose-500',
    soft: 'bg-rose-50',
    text: 'text-rose-700',
    hoverShadow: 'hover:shadow-rose-500/10',
  },
  {
    border: 'border-purple-200',
    accent: 'bg-purple-500',
    soft: 'bg-purple-50',
    text: 'text-purple-700',
    hoverShadow: 'hover:shadow-purple-500/10',
  },
  {
    border: 'border-indigo-200',
    accent: 'bg-indigo-500',
    soft: 'bg-indigo-50',
    text: 'text-indigo-700',
    hoverShadow: 'hover:shadow-indigo-500/10',
  },
  {
    border: 'border-teal-200',
    accent: 'bg-teal-500',
    soft: 'bg-teal-50',
    text: 'text-teal-700',
    hoverShadow: 'hover:shadow-teal-500/10',
  },
  {
    border: 'border-pink-200',
    accent: 'bg-pink-500',
    soft: 'bg-pink-50',
    text: 'text-pink-700',
    hoverShadow: 'hover:shadow-pink-500/10',
  },
] as const

export function teamColor(name: string): (typeof PALETTE)[number] {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
