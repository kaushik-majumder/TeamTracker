'use server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { canManageUser } from '@/lib/hierarchy'
import { validateEmailDomain } from '@/lib/email-validation'
import { audit } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

const UpdateUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1, { error: 'Name is required' }),
  email: z.email({ error: 'Invalid email' }),
  password: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.password && val.password.length < 6) {
    ctx.addIssue({ code: 'custom', path: ['password'], message: 'Password must be at least 6 characters' })
  }
})

export async function updateUser(_state: unknown, formData: FormData) {
  const session = await requireAuth()
  const validated = UpdateUserSchema.safeParse({
    userId: formData.get('userId'),
    name: formData.get('name'),
    email: formData.get('email'),
    password: (formData.get('password') as string) || undefined,
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const { userId, name, email, password } = validated.data

  // Authorize
  const allowed = await canManageUser({
    viewerId: session.userId,
    viewerBaseRole: session.role,
    targetUserId: userId,
  })
  if (!allowed) return { message: 'Not authorized to edit this user' }

  // Verify email domain (only re-check if it changed)
  const current = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (!current) return { message: 'User not found' }

  if (current.email !== email) {
    const domainError = await validateEmailDomain(email)
    if (domainError) return { errors: { email: [domainError] } }

    const taken = await prisma.user.findUnique({ where: { email } })
    if (taken && taken.id !== userId) return { message: 'Another user already has that email' }
  }

  const data: { name: string; email: string; password?: string } = { name, email }
  if (password) data.password = await bcrypt.hash(password, 12)

  await prisma.user.update({ where: { id: userId }, data })

  await audit({
    actorId: session.userId,
    action: 'user.update',
    entityType: 'User',
    entityId: userId,
    details: { name, email, passwordChanged: !!password },
  })

  revalidatePath('/dashboard/admin/users')
  revalidatePath('/dashboard/teams', 'layout')
  return { success: true }
}
