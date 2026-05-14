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
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bell size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No notifications yet.</p>
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
