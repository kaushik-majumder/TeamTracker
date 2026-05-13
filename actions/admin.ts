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
  teamMode: z.enum(['none', 'existing', 'new']).default('none'),
  existingTeamId: z.string().optional(),
  newTeamName: z.string().optional(),
  newTeamDescription: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.teamMode === 'existing' && !val.existingTeamId) {
    ctx.addIssue({ code: 'custom', path: ['existingTeamId'], message: 'Select a team' })
  }
  if (val.teamMode === 'new' && !val.newTeamName) {
    ctx.addIssue({ code: 'custom', path: ['newTeamName'], message: 'Enter a team name' })
  }
})

export async function createUser(_state: unknown, formData: FormData) {
  await requireAdmin()
  const validated = CreateUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
    teamMode: formData.get('teamMode') ?? 'none',
    existingTeamId: formData.get('existingTeamId') || undefined,
    newTeamName: formData.get('newTeamName') || undefined,
    newTeamDescription: formData.get('newTeamDescription') || undefined,
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const existing = await prisma.user.findUnique({ where: { email: validated.data.email } })
  if (existing) return { message: 'A user with that email already exists' }

  const hashed = await bcrypt.hash(validated.data.password, 12)
  const role = validated.data.role as Role

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: validated.data.name, email: validated.data.email, password: hashed, role },
    })

    let teamId: string | null = null
    if (validated.data.teamMode === 'existing' && validated.data.existingTeamId) {
      teamId = validated.data.existingTeamId
    } else if (validated.data.teamMode === 'new' && validated.data.newTeamName) {
      const team = await tx.team.create({
        data: {
          name: validated.data.newTeamName,
          description: validated.data.newTeamDescription,
        },
      })
      teamId = team.id
    }

    if (teamId) {
      await tx.teamAccess.create({
        data: { userId: user.id, teamId, role },
      })
    }
  })

  revalidatePath('/dashboard/admin/users')
  revalidatePath('/dashboard/admin/teams')
  return { success: true }
}

export async function deleteUser(userId: string) {
  await requireAdmin()
  await prisma.user.delete({ where: { id: userId } })
  revalidatePath('/dashboard/admin/users')
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
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }
  await prisma.team.create({ data: validated.data })
  revalidatePath('/dashboard/admin/teams')
  return { success: true }
}

export async function deleteTeam(teamId: string) {
  await requireAdmin()
  await prisma.team.delete({ where: { id: teamId } })
  revalidatePath('/dashboard/admin/teams')
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
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const { teamId, userId, role } = validated.data
  await prisma.teamAccess.upsert({
    where: { userId_teamId: { userId, teamId } },
    update: { role: role as Role },
    create: { userId, teamId, role: role as Role },
  })
  revalidatePath(`/dashboard/admin/teams/${teamId}`)
  return { success: true }
}

export async function removeUserFromTeam(teamId: string, userId: string) {
  await requireAdmin()
  await prisma.teamAccess.deleteMany({ where: { teamId, userId } })
  revalidatePath(`/dashboard/admin/teams/${teamId}`)
}
