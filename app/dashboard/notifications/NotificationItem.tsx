'use client'
import { markNotificationRead } from '@/actions/notifications'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { TrendingUp, DollarSign, CheckCircle2, ClipboardCheck } from 'lucide-react'
import { NotificationType } from '@prisma/client'

type Props = {
  id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  unread: boolean
  timeAgo: string
}

const iconFor: Record<NotificationType, { icon: typeof TrendingUp; color: string }> = {
  PROMOTION_SUBMITTED: { icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
  PROMOTION_REVIEWED: { icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  SALARY_SUBMITTED: { icon: DollarSign, color: 'text-purple-600 bg-purple-50' },
  SALARY_REVIEWED: { icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  REVIEW_ASSIGNED: { icon: ClipboardCheck, color: 'text-indigo-600 bg-indigo-50' },
}

export function NotificationItem({ id, type, title, message, link, unread, timeAgo }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const { icon: Icon, color } = iconFor[type] ?? { icon: TrendingUp, color: 'text-gray-600 bg-gray-50' }

  const handleClick = () => {
    if (unread) {
      startTransition(() => markNotificationRead(id))
    }
    if (link) router.push(link)
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
        unread
          ? 'bg-white border-blue-200 hover:bg-blue-50/40'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className={`p-2 rounded-lg ${color} mt-0.5`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm ${unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
            {title}
          </p>
          {unread && <span className="w-2 h-2 rounded-full bg-blue-500" />}
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{message}</p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>
    </button>
  )
}
