'use server'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { propagateAccessUpChain } from '@/lib/hierarchy'
import { validateEmailDomain } from '@/lib/email-validation'
import { sendEmail, inviteEmail } from '@/lib/email'
import { audit } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { Role } from '@prisma/client'

const APP_URL = process.env.APP_URL || 'http://localhost:3000'

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

// ─── Create User OR Team Member ─────────────────────────────────────────────

const CreatePersonSchema = z.object({
  // Common
  name: z.string().min(1, { error: 'Name is required' }),
  email: z.email({ error: 'Invalid email' }),
  role: z.enum(['MANAGING_DIRECTOR', 'MANAGER', 'TEAM_LEAD', 'TEAM_MEMBER']),

  // Team member only
  designation: z.string().optional(),
  joinDate: z.string().optional(),

  // Team assignment.
  // Single-team flow (used by TEAM_MEMBER, TEAM_LEAD):
  teamMode: z.enum(['none', 'existing', 'new']).default('none'),
  existingTeamId: z.string().optional(),
  // Multi-team flow (used by MANAGER):
  selectedTeamIds: z.array(z.string()).default([]),
  // New team optionally created alongside either flow:
  newTeamName: z.string().optional(),
  newTeamDescription: z.string().optional(),
}).superRefine((val, ctx) => {
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
  const adminSession = await requireAdmin()
  const validated = CreatePersonSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
    designation: formData.get('designation') || undefined,
    joinDate: formData.get('joinDate') || undefined,
    teamMode: formData.get('teamMode') ?? 'none',
    existingTeamId: formData.get('existingTeamId') || undefined,
    selectedTeamIds: formData.getAll('selectedTeamIds').filter(Boolean) as string[],
    newTeamName: formData.get('newTeamName') || undefined,
    newTeamDescription: formData.get('newTeamDescription') || undefined,
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const data = validated.data
  // MD doesn't need direct team assignment — they gain access automatically
  // when managers are set to report to them.
  const isManagerWithDirectTeams = data.role === 'MANAGER'

  // Verify the email domain has working mail servers
  const domainError = await validateEmailDomain(data.email)
  if (domainError) return { errors: { email: [domainError] } }

  // Pre-check email uniqueness for login-capable users
  if (data.role !== 'TEAM_MEMBER') {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) return { message: 'A user with that email already exists' }
  }

  // Setup token for login-capable users
  const setupToken = data.role !== 'TEAM_MEMBER' ? generateToken() : null
  const setupExpiresAt = setupToken ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null

  const newUserId = await prisma.$transaction(async (tx) => {
    const teamIds: string[] = []

    if (isManagerWithDirectTeams) {
      teamIds.push(...data.selectedTeamIds)
      if (data.newTeamName) {
        const team = await tx.team.create({
          data: { name: data.newTeamName, description: data.newTeamDescription },
        })
        teamIds.push(team.id)
      }
    } else if (data.role !== 'MANAGING_DIRECTOR') {
      // TEAM_LEAD or TEAM_MEMBER — single-team flow
      if (data.teamMode === 'existing' && data.existingTeamId) {
        teamIds.push(data.existingTeamId)
      } else if (data.teamMode === 'new' && data.newTeamName) {
        const team = await tx.team.create({
          data: { name: data.newTeamName, description: data.newTeamDescription },
        })
        teamIds.push(team.id)
      }
    }
    // MD: no teams assigned directly — propagation handles it later

    if (data.role === 'TEAM_MEMBER') {
      await tx.employee.create({
        data: {
          name: data.name,
          email: data.email,
          title: data.designation!,
          joinDate: new Date(data.joinDate!),
          teamId: teamIds[0]!,
        },
      })
      return null
    } else {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: null,
          passwordSetupToken: setupToken,
          passwordSetupExpiresAt: setupExpiresAt,
          role: data.role as Role,
        },
      })
      for (const teamId of teamIds) {
        await tx.teamAccess.create({
          data: { userId: user.id, teamId, role: data.role as Role },
        })
      }
      return user.id
    }
  })

  if (newUserId) {
    await propagateAccessUpChain(newUserId)

    // Send invite email
    if (setupToken) {
      const setupUrl = `${APP_URL}/setup-password?token=${setupToken}`
      await sendEmail({
        to: data.email,
        ...inviteEmail({
          recipientName: data.name,
          inviterName: adminSession.name,
          setupUrl,
        }),
      })
    }
  }

  await audit({
    actorId: adminSession.userId,
    action: data.role === 'TEAM_MEMBER' ? 'employee.create' : 'user.create',
    entityType: data.role === 'TEAM_MEMBER' ? 'Employee' : 'User',
    entityId: newUserId ?? undefined,
    details: { name: data.name, email: data.email, role: data.role },
  })

  revalidatePath('/dashboard/admin/users')
  revalidatePath('/dashboard/admin/teams')
  revalidatePath('/dashboard/teams')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const session = await requireAdmin()
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, role: true },
  })
  await prisma.user.delete({ where: { id: userId } })
  await audit({
    actorId: session.userId,
    action: 'user.delete',
    entityType: 'User',
    entityId: userId,
    details: target ?? undefined,
  })
  revalidatePath('/dashboard/admin/users')
}

// ─── Teams ──────────────────────────────────────────────────────────────────

const CreateTeamSchema = z.object({
  name: z.string().min(1, { error: 'Team name is required' }),
  description: z.string().optional(),
})

export async function adminCreateTeam(_state: unknown, formData: FormData) {
  const session = await requireAdmin()
  const validated = CreateTeamSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }
  const team = await prisma.team.create({ data: validated.data })
  await audit({
    actorId: session.userId,
    action: 'team.create',
    entityType: 'Team',
    entityId: team.id,
    details: { name: team.name },
  })
  revalidatePath('/dashboard/admin/teams')
  return { success: true }
}

export async function deleteTeam(teamId: string) {
  const session = await requireAdmin()
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } })
  await prisma.team.delete({ where: { id: teamId } })
  await audit({
    actorId: session.userId,
    action: 'team.delete',
    entityType: 'Team',
    entityId: teamId,
    details: team ?? undefined,
  })
  revalidatePath('/dashboard/admin/teams')
}

const AssignAccessSchema = z.object({
  teamId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(['MANAGING_DIRECTOR', 'MANAGER', 'TEAM_LEAD']),
})

export async function assignUserToTeam(_state: unknown, formData: FormData) {
  const session = await requireAdmin()
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
  // Cascade this team to all supervisors above the user.
  await propagateAccessUpChain(userId)

  await audit({
    actorId: session.userId,
    action: 'team.access.grant',
    entityType: 'TeamAccess',
    entityId: `${userId}|${teamId}`,
    details: { userId, teamId, role },
  })

  revalidatePath(`/dashboard/admin/teams/${teamId}`)
  revalidatePath('/dashboard/teams')
  return { success: true }
}

export async function removeUserFromTeam(teamId: string, userId: string) {
  const session = await requireAdmin()
  await prisma.teamAccess.deleteMany({ where: { teamId, userId } })
  await audit({
    actorId: session.userId,
    action: 'team.access.revoke',
    entityType: 'TeamAccess',
    entityId: `${userId}|${teamId}`,
    details: { userId, teamId },
  })
  revalidatePath(`/dashboard/admin/teams/${teamId}`)
}
