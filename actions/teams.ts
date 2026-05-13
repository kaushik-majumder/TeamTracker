'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth, requireManagerOrAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Role } from '@prisma/client'

const TeamSchema = z.object({
  name: z.string().min(1, { error: 'Name is required' }),
  description: z.string().optional(),
})

export async function createTeam(_state: unknown, formData: FormData) {
  const session = await requireManagerOrAdmin()
  const validated = TeamSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const team = await prisma.team.create({
    data: {
      ...validated.data,
      teamAccess: { create: { userId: session.userId, role: Role.MANAGER } },
    },
  })
  revalidatePath('/dashboard/teams')
  redirect(`/dashboard/teams/${team.id}`)
}

export async function assignTeamAccess(_state: unknown, formData: FormData) {
  await requireManagerOrAdmin()
  const teamId = formData.get('teamId') as string
  const userId = formData.get('userId') as string
  const role = formData.get('role') as Role

  await prisma.teamAccess.upsert({
    where: { userId_teamId: { userId, teamId } },
    update: { role },
    create: { userId, teamId, role },
  })
  revalidatePath(`/dashboard/teams/${teamId}`)
}

export async function removeTeamAccess(teamId: string, userId: string) {
  await requireManagerOrAdmin()
  await prisma.teamAccess.deleteMany({ where: { teamId, userId } })
  revalidatePath(`/dashboard/teams/${teamId}`)
}

export async function getAccessibleTeams() {
  const session = await requireAuth()
  return prisma.team.findMany({
    where: { teamAccess: { some: { userId: session.userId } } },
    include: { _count: { select: { employees: true } }, teamAccess: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
  })
}
