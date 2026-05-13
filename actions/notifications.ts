'use server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function markNotificationRead(notificationId: string) {
  const session = await requireAuth()
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.userId, readAt: null },
    data: { readAt: new Date() },
  })
  revalidatePath('/dashboard/notifications')
  revalidatePath('/dashboard', 'layout')
}

export async function markAllNotificationsRead() {
  const session = await requireAuth()
  await prisma.notification.updateMany({
    where: { userId: session.userId, readAt: null },
    data: { readAt: new Date() },
  })
  revalidatePath('/dashboard/notifications')
  revalidatePath('/dashboard', 'layout')
}
