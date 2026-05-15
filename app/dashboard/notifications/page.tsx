import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDistanceToNow } from 'date-fns'
import { Bell } from 'lucide-react'
import { MarkAllReadButton } from './MarkAllReadButton'
import { NotificationItem } from './NotificationItem'

export default async function NotificationsPage() {
  const session = await requireAuth()

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const unreadCount = notifications.filter((n) => !n.readAt).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-12 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-sm mb-3">
            <Bell size={32} className="text-blue-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              id={n.id}
              type={n.type}
              title={n.title}
              message={n.message}
              link={n.link}
              unread={!n.readAt}
              timeAgo={formatDistanceToNow(n.createdAt, { addSuffix: true })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
