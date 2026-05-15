'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Role } from '@prisma/client'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

type Props = {
  session: { name: string; email: string; role: Role }
  profileImageUrl: string | null
  pendingWorkflows: number
  unreadNotifications: number
  pendingReviews: number
  children: React.ReactNode
}

export function DashboardShell({
  session,
  profileImageUrl,
  pendingWorkflows,
  unreadNotifications,
  pendingReviews,
  children,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  // Close the drawer when navigating to a new route
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar — fixed on mobile (drawer), static on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-60 transform transition-transform duration-200 md:static md:translate-x-0 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar
          name={session.name}
          role={session.role}
          pendingWorkflows={pendingWorkflows}
          unreadNotifications={unreadNotifications}
          pendingReviews={pendingReviews}
        />
      </div>

      {/* Backdrop for mobile drawer */}
      {drawerOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar
          name={session.name}
          email={session.email}
          imageUrl={profileImageUrl}
          onMenuClick={() => setDrawerOpen(true)}
        />
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
