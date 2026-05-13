'use server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { Role } from '@prisma/client'

const CreateUserSchema = z.object({
  name: z.string().min(1, { error: 'Name is required' }),
  email: z.email({ error: 'Invalid email' }),
  password: z.string().min(6, { error: 'Password must be at least 6 characters' }),
  role: z.enum(['MANAGER', 'TEAM_LEAD']),
})

export async function createUser(_state: unknown, formData: FormData) {
  await requireAdmin()
  const validated = CreateUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const existing = await prisma.user.findUnique({ where: { email: validated.data.email } })
  if (existing) return { message: 'A user with that email already exists' }

  const hashed = await bcrypt.hash(validated.data.password, 12)
  await prisma.user.create({
    data: {
      name: validated.data.name,
      email: validated.data.email,
      password: hashed,
      role: validated.data.role as Role,
    },
  })
  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteUser(userId: string) {
  await requireAdmin()
  await prisma.user.delete({ where: { id: userId } })
  revalidatePath('/admin/users')
}

const CreateTeamSchema = z.object({
  name: z.string().min(1, { error: 'Team name is required' }),
  description: z.string().optional(),
})

export async function adminCreateTeam(_state: unknown, formData: FormData) {
  await requireAdmin()
  const validated = CreateTeamSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }
  await prisma.team.create({ data: validated.data })
  revalidatePath('/admin/teams')
  return { success: true }
}

export async function deleteTeam(teamId: string) {
  await requireAdmin()
  await prisma.team.delete({ where: { id: teamId } })
  revalidatePath('/admin/teams')
}

const AssignAccessSchema = z.object({
  teamId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(['MANAGER', 'TEAM_LEAD']),
})

export async function assignUserToTeam(_state: unknown, formData: FormData) {
  await requireAdmin()
  const validated = AssignAccessSchema.safeParse({
    teamId: formData.get('teamId'),
    userId: formData.get('userId'),
    role: formData.get('role'),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { teamId, userId, role } = validated.data
  await prisma.teamAccess.upsert({
    where: { userId_teamId: { userId, teamId } },
    update: { role: role as Role },
    create: { userId, teamId, role: role as Role },
  })
  revalidatePath(`/admin/teams/${teamId}`)
  return { success: true }
}

export async function removeUserFromTeam(teamId: string, userId: string) {
  await requireAdmin()
  await prisma.teamAccess.deleteMany({ where: { teamId, userId } })
  revalidatePath(`/admin/teams/${teamId}`)
}
