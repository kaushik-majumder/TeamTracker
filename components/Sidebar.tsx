'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Role } from '@prisma/client'
import { Users, LayoutDashboard, GitBranch, UserPlus, Building2, Shield, Bell, Network, ClipboardCheck, CalendarRange, ScrollText } from 'lucide-react'

type Props = {
  name: string
  role: Role
  pendingWorkflows?: number
  unreadNotifications?: number
  pendingReviews?: number
}

export function Sidebar({
  name,
  role,
  pendingWorkflows = 0,
  unreadNotifications = 0,
  pendingReviews = 0,
}: Props) {
  const pathname = usePathname()
  const isAdmin = role === 'ADMIN'

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true, badge: 0 },
    { href: '/dashboard/teams', label: 'Teams', icon: Users, badge: 0 },
    { href: '/dashboard/workflows', label: 'Workflows', icon: GitBranch, badge: pendingWorkflows },
    { href: '/dashboard/reviews', label: 'Reviews', icon: ClipboardCheck, badge: pendingReviews },
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications },
  ]

  const adminItems = [
    { href: '/dashboard/admin/users', label: 'Manage Users', icon: UserPlus },
    { href: '/dashboard/admin/teams', label: 'Manage Teams', icon: Building2 },
    { href: '/dashboard/admin/hierarchy', label: 'Hierarchy', icon: Network },
    { href: '/dashboard/admin/review-cycles', label: 'Review Cycles', icon: CalendarRange },
    { href: '/dashboard/admin/audit-log', label: 'Audit Log', icon: ScrollText },
  ]

  const roleBadge = {
    ADMIN: { label: 'Admin', cls: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white' },
    MANAGING_DIRECTOR: { label: 'Managing Director', cls: 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white' },
    MANAGER: { label: 'Manager', cls: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' },
    TEAM_LEAD: { label: 'Team Lead', cls: 'bg-gradient-to-r from-gray-600 to-slate-600 text-white' },
  }[role]

  const linkClass = (href: string, exact = false) => {
    const active = exact ? pathname === href : pathname.startsWith(href) && pathname !== '/dashboard'
    const isDashboardRoot = href === '/dashboard' && pathname === '/dashboard'
    return `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
      active || isDashboardRoot ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`
  }

  return (
    <aside className="w-60 h-full bg-gray-900 text-white flex flex-col overflow-y-auto">
      <div className="px-5 py-5 border-b border-gray-700">
        <p className="font-bold text-lg">TeamTracker</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{name}</p>
        <span className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${roleBadge.cls}`}>
          {roleBadge.label}
        </span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact, badge }) => (
          <Link key={href} href={href} className={linkClass(href, exact)}>
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="text-[10px] font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {badge}
              </span>
            )}
          </Link>
        ))}

        {isAdmin && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
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

    </aside>
  )
}
