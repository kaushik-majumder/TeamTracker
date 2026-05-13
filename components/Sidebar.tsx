'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/auth'
import { Role } from '@prisma/client'
import { Users, LayoutDashboard, GitBranch, LogOut, Building2 } from 'lucide-react'

type Props = { name: string; role: Role }

export function Sidebar({ name, role }: Props) {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/teams', label: 'Teams', icon: Users },
    { href: '/dashboard/workflows', label: 'Workflows', icon: GitBranch },
    ...(role === 'MANAGER'
      ? [{ href: '/dashboard/teams/new', label: 'New Team', icon: Building2 }]
      : []),
  ]

  return (
    <aside className="w-60 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-5 py-5 border-b border-gray-700">
        <p className="font-bold text-lg">TeamTracker</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{name}</p>
        <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-700 text-blue-100">
          {role === 'MANAGER' ? 'Manager' : 'Team Lead'}
        </span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-700">
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
