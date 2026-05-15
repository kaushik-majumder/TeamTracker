'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { logout } from '@/actions/auth'
import { Avatar } from './Avatar'
import { ChevronDown, User, LogOut, Menu } from 'lucide-react'

type Props = {
  name: string
  email: string
  imageUrl?: string | null
  onMenuClick?: () => void
}

export function TopBar({ name, email, imageUrl, onMenuClick }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        {/* Hamburger — visible only on mobile */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="md:hidden p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="flex-1" />

        {/* User menu */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors"
          >
            <Avatar name={name} imageUrl={imageUrl} size={32} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">{name}</span>
            <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-40 min-w-[220px] overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{email}</p>
              </div>
              <Link
                href="/dashboard/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <User size={14} /> Profile
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-left border-t border-gray-100 dark:border-gray-800"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
