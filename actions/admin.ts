'use server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { Role } from '@prisma/client'

// ─── Create User OR Team Member ─────────────────────────────────────────────

const CreatePersonSchema = z.object({
  // Common
  name: z.string().min(1, { error: 'Name is required' }),
  email: z.email({ error: 'Invalid email' }),
  role: z.enum(['MANAGER', 'TEAM_LEAD', 'TEAM_MEMBER']),

  // Manager/Lead only
  password: z.string().optional(),

  // Team member only
  designation: z.string().optional(),
  joinDate: z.string().optional(),

  // Team assignment
  teamMode: z.enum(['none', 'existing', 'new']).default('none'),
  existingTeamId: z.string().optional(),
  newTeamName: z.string().optional(),
  newTeamDescription: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.role === 'MANAGER' || val.role === 'TEAM_LEAD') {
    if (!val.password || val.password.length < 6) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: 'Password must be at least 6 characters' })
    }
  }
  if (val.role === 'TEAM_MEMBER') {
    if (!val.designation) {
      ctx.addIssue({ code: 'custom', path: ['designation'], message: 'Designation is required' })
    }
    if (!val.joinDate) {
      ctx.addIssue({ code: 'custom', path: ['joinDate'], message: 'Join date is required' })
    }
    if (val.teamMode === 'none') {
      ctx.addIssue({ code: 'custom', path: ['teamMode'], message: 'Team members must be assigned to a team' })
    }
  }
  if (val.teamMode === 'existing' && !val.existingTeamId) {
    ctx.addIssue({ code: 'custom', path: ['existingTeamId'], message: 'Select a team' })
  }
  if (val.teamMode === 'new' && !val.newTeamName) {
    ctx.addIssue({ code: 'custom', path: ['newTeamName'], message: 'Enter a team name' })
  }
})

export async function createUser(_state: unknown, formData: FormData) {
  await requireAdmin()
  const validated = CreatePersonSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
    password: formData.get('password') || undefined,
    designation: formData.get('designation') || undefined,
    joinDate: formData.get('joinDate') || undefined,
    teamMode: formData.get('teamMode') ?? 'none',
    existingTeamId: formData.get('existingTeamId') || undefined,
    newTeamName: formData.get('newTeamName') || undefined,
    newTeamDescription: formData.get('newTeamDescription') || undefined,
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const data = validated.data

  // Pre-check email uniqueness for login-capable users
  if (data.role !== 'TEAM_MEMBER') {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) return { message: 'A user with that email already exists' }
  }

  await prisma.$transaction(async (tx) => {
    let teamId: string | null = null
    if (data.teamMode === 'existing' && data.existingTeamId) {
      teamId = data.existingTeamId
    } else if (data.teamMode === 'new' && data.newTeamName) {
      const team = await tx.team.create({
        data: { name: data.newTeamName, description: data.newTeamDescription },
      })
      teamId = team.id
    }

    if (data.role === 'TEAM_MEMBER') {
      await tx.employee.create({
        data: {
          name: data.name,
          email: data.email,
          title: data.designation!,
          joinDate: new Date(data.joinDate!),
          teamId: teamId!,
        },
      })
    } else {
      const hashed = await bcrypt.hash(data.password!, 12)
      const user = await tx.user.create({
        data: { name: data.name, email: data.email, password: hashed, role: data.role as Role },
      })
      if (teamId) {
        await tx.teamAccess.create({
          data: { userId: user.id, teamId, role: data.role as Role },
        })
      }
    }
  })

  revalidatePath('/dashboard/admin/users')
  revalidatePath('/dashboard/admin/teams')
  revalidatePath('/dashboard/teams')
  return { success: true }
}

export async function deleteUser(userId: string) {
  await requireAdmin()
  await prisma.user.delete({ where: { id: userId } })
  revalidatePath('/dashboard/admin/users')
}

// ─── Teams ──────────────────────────────────────────────────────────────────

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
