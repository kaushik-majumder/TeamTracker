import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { logout } from '@/actions/auth'
import { Users, Building2, LogOut, ArrowLeft } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 min-h-screen bg-gray-900 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-gray-700">
          <p className="font-bold text-lg">TeamTracker</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{session.name}</p>
          <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-700 text-purple-100">
            Admin
          </span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <Users size={16} /> Users
          </Link>
          <Link href="/admin/teams" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <Building2 size={16} /> Teams
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors mt-4 pt-4 border-t border-gray-700">
            <ArrowLeft size={16} /> Back to App
          </Link>
        </nav>

        <div className="px-3 py-4 border-t border-gray-700">
          <form action={logout}>
            <button type="submit" className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <LogOut size={16} /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
