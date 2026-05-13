'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/auth'
import { Role } from '@prisma/client'
import { Users, LayoutDashboard, GitBranch, LogOut, UserPlus, Building2, Shield } from 'lucide-react'

type Props = { name: string; role: Role }

export function Sidebar({ name, role }: Props) {
  const pathname = usePathname()
  const isAdmin = role === 'ADMIN'

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/teams', label: 'Teams', icon: Users },
    { href: '/dashboard/workflows', label: 'Workflows', icon: GitBranch },
  ]

  const adminItems = [
    { href: '/dashboard/admin/users', label: 'Manage Users', icon: UserPlus },
    { href: '/dashboard/admin/teams', label: 'Manage Teams', icon: Building2 },
  ]

  const roleBadge = {
    ADMIN: { label: 'Admin', cls: 'bg-purple-700 text-purple-100' },
    MANAGER: { label: 'Manager', cls: 'bg-blue-700 text-blue-100' },
    TEAM_LEAD: { label: 'Team Lead', cls: 'bg-gray-700 text-gray-100' },
  }[role]

  const linkClass = (href: string, exact = false) => {
    const active = exact ? pathname === href : pathname.startsWith(href) && pathname !== '/dashboard'
    const isDashboardRoot = href === '/dashboard' && pathname === '/dashboard'
    return `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
      active || isDashboardRoot ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`
  }

  return (
    <aside className="w-60 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-5 py-5 border-b border-gray-700">
        <p className="font-bold text-lg">TeamTracker</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{name}</p>
        <span className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${roleBadge.cls}`}>
          {roleBadge.label}
        </span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link key={href} href={href} className={linkClass(href, exact)}>
            <Icon size={16} />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Shield size={11} /> Admin
            </p>
            {adminItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={linkClass(href)}>
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-gray-700">
        <form action={logout}>
          <button type="submit" className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <LogOut size={16} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
