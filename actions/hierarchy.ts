'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { levelOf } from '@/lib/hierarchy'
import { revalidatePath } from 'next/cache'

const SetReportsToSchema = z.object({
  userId: z.string().min(1),
  reportsToId: z.string().min(1).nullable(),
})

export async function setReportsTo(_state: unknown, formData: FormData) {
  await requireAdmin()
  const raw = formData.get('reportsToId')
  const validated = SetReportsToSchema.safeParse({
    userId: formData.get('userId'),
    reportsToId: raw && raw !== '' ? raw : null,
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const { userId, reportsToId } = validated.data

  if (reportsToId === userId) {
    return { message: 'A user cannot report to themselves' }
  }

  // If a manager is being assigned, verify they outrank the reportee and we're
  // not creating a cycle.
  if (reportsToId) {
    const [user, manager] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
      prisma.user.findUnique({ where: { id: reportsToId }, select: { role: true } }),
    ])
    if (!user || !manager) return { message: 'User not found' }

    if (levelOf(manager.role) <= levelOf(user.role)) {
      return { message: `${manager.role} cannot be the supervisor of ${user.role}` }
    }

    // Cycle detection — walk up the new manager's reporting chain.
    let cursor: string | null = reportsToId
    const visited = new Set<string>()
    while (cursor) {
      if (cursor === userId) return { message: 'This would create a reporting cycle' }
      if (visited.has(cursor)) break
      visited.add(cursor)
      const next: { reportsToId: string | null } | null = await prisma.user.findUnique({
        where: { id: cursor },
        select: { reportsToId: true },
      })
      cursor = next?.reportsToId ?? null
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { reportsToId },
  })

  revalidatePath('/dashboard/admin/hierarchy')
  return { success: true }
}
