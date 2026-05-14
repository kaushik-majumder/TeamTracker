'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdmin, requireAuth } from '@/lib/auth'
import { notify } from '@/lib/notifications'
import { levelOf } from '@/lib/hierarchy'
import { audit } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { Role } from '@prisma/client'

const APP_URL = process.env.APP_URL || 'http://localhost:3000'

const CreateCycleSchema = z.object({
  name: z.string().min(1, { error: 'Cycle name is required' }),
  description: z.string().optional(),
  startDate: z.string().min(1, { error: 'Start date is required' }),
  endDate: z.string().min(1, { error: 'End date is required' }),
  scope: z.enum(['ALL', 'SELECTED']),
  selectedTeamIds: z.array(z.string()).default([]),
}).superRefine((val, ctx) => {
  if (new Date(val.endDate) <= new Date(val.startDate)) {
    ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'End date must be after start date' })
  }
  if (val.scope === 'SELECTED' && val.selectedTeamIds.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['selectedTeamIds'], message: 'Pick at least one team' })
  }
})

export async function createReviewCycle(_state: unknown, formData: FormData) {
  const session = await requireAdmin()
  const validated = CreateCycleSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    scope: formData.get('scope') || 'ALL',
    selectedTeamIds: formData.getAll('selectedTeamIds').filter(Boolean) as string[],
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const data = validated.data
  const cycle = await prisma.reviewCycle.create({
    data: {
      name: data.name,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      createdBy: session.userId,
      teams: data.scope === 'SELECTED'
        ? { create: data.selectedTeamIds.map((teamId) => ({ teamId })) }
        : undefined,
    },
  })

  await audit({
    actorId: session.userId,
    action: 'cycle.create',
    entityType: 'ReviewCycle',
    entityId: cycle.id,
    details: { name: data.name, scope: data.scope, teamCount: data.selectedTeamIds.length },
  })

  revalidatePath('/dashboard/admin/review-cycles')
  return { success: true }
}

/**
 * Pick the closest manager-of-record for an employee on a team:
 *   TEAM_LEAD → MANAGER → MANAGING_DIRECTOR → first admin
 */
async function pickReviewerForEmployee(teamId: string): Promise<string | null> {
  const access = await prisma.teamAccess.findMany({
    where: { teamId },
    select: { userId: true, role: true },
  })
  if (access.length === 0) return null
  // Sort by level ascending so closest manager comes first
  access.sort((a, b) => levelOf(a.role) - levelOf(b.role))
  return access[0].userId
}

export async function openReviewCycle(cycleId: string) {
  const session = await requireAdmin()
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
    include: { teams: true },
  })
  if (!cycle) return { message: 'Cycle not found' }
  if (cycle.status !== 'DRAFT') return { message: 'Only DRAFT cycles can be opened' }

  // Determine target employees
  const teamFilter =
    cycle.teams.length === 0
      ? {} // ALL teams
      : { teamId: { in: cycle.teams.map((t) => t.teamId) } }

  const employees = await prisma.employee.findMany({
    where: { status: 'ACTIVE', ...teamFilter },
    select: { id: true, teamId: true, name: true },
  })

  // Auto-assign reviewers; create CycleReview rows in a transaction
  const reviewRows = await Promise.all(
    employees.map(async (e) => ({
      employeeId: e.id,
      teamId: e.teamId,
      employeeName: e.name,
      reviewerId: await pickReviewerForEmployee(e.teamId),
    }))
  )

  await prisma.$transaction([
    ...reviewRows.map((r) =>
      prisma.cycleReview.create({
        data: {
          cycleId,
          employeeId: r.employeeId,
          reviewerId: r.reviewerId,
        },
      })
    ),
    prisma.reviewCycle.update({
      where: { id: cycleId },
      data: { status: 'OPEN' },
    }),
  ])

  // Notify each reviewer about their assigned reviews
  const byReviewer = new Map<string, { count: number; names: string[] }>()
  for (const r of reviewRows) {
    if (!r.reviewerId) continue
    const e = byReviewer.get(r.reviewerId) ?? { count: 0, names: [] }
    e.count++
    e.names.push(r.employeeName)
    byReviewer.set(r.reviewerId, e)
  }

  for (const [reviewerId, info] of byReviewer.entries()) {
    const user = await prisma.user.findUnique({
      where: { id: reviewerId },
      select: { name: true, email: true },
    })
    if (!user) continue
    await notify({
      userId: reviewerId,
      type: 'REVIEW_ASSIGNED',
      title: `${info.count} review${info.count === 1 ? '' : 's'} to complete — ${cycle.name}`,
      message:
        info.count === 1
          ? `You have a review to complete for ${info.names[0]}.`
          : `You have ${info.count} reviews to complete: ${info.names.slice(0, 3).join(', ')}${info.names.length > 3 ? '…' : ''}.`,
      link: '/dashboard/reviews',
      email: {
        to: user.email,
        subject: `${cycle.name}: ${info.count} performance review${info.count === 1 ? '' : 's'} assigned to you`,
        html: `
          <div style="font-family:-apple-system,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#1f2937;">
            <h2 style="margin-top:0;">${cycle.name} is now open</h2>
            <p>Hi ${user.name},</p>
            <p>You have <strong>${info.count}</strong> performance review${info.count === 1 ? '' : 's'} assigned to you for this cycle:</p>
            <ul>
              ${info.names.map((n) => `<li>${n}</li>`).join('')}
            </ul>
            <p>Due by ${cycle.endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
            <p style="margin-top:16px;">
              <a href="${APP_URL}/dashboard/reviews" style="display:inline-block;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:500;">Open my reviews →</a>
            </p>
            <p style="color:#9ca3af;font-size:12px;margin-top:32px;">— Team eXp Realty</p>
          </div>
        `,
      },
    })
  }

  await audit({
    actorId: session.userId,
    action: 'cycle.open',
    entityType: 'ReviewCycle',
    entityId: cycleId,
    details: { cycleName: cycle.name, reviewsCreated: reviewRows.length },
  })

  revalidatePath('/dashboard/admin/review-cycles')
  revalidatePath('/dashboard/admin/review-cycles/' + cycleId)
  revalidatePath('/dashboard/reviews')
  revalidatePath('/dashboard', 'layout')
  return { success: true, opened: reviewRows.length }
}

export async function closeReviewCycle(cycleId: string) {
  const session = await requireAdmin()
  const cycle = await prisma.reviewCycle.findUnique({ where: { id: cycleId } })
  if (!cycle) return { message: 'Cycle not found' }
  if (cycle.status !== 'OPEN') return { message: 'Only OPEN cycles can be closed' }

  await prisma.reviewCycle.update({
    where: { id: cycleId },
    data: { status: 'CLOSED' },
  })
  await audit({
    actorId: session.userId,
    action: 'cycle.close',
    entityType: 'ReviewCycle',
    entityId: cycleId,
    details: { cycleName: cycle.name },
  })
  revalidatePath('/dashboard/admin/review-cycles')
  return { success: true }
}

export async function deleteReviewCycle(cycleId: string) {
  const session = await requireAdmin()
  const cycle = await prisma.reviewCycle.findUnique({ where: { id: cycleId }, select: { name: true } })
  await prisma.reviewCycle.delete({ where: { id: cycleId } })
  await audit({
    actorId: session.userId,
    action: 'cycle.delete',
    entityType: 'ReviewCycle',
    entityId: cycleId,
    details: cycle ?? undefined,
  })
  revalidatePath('/dashboard/admin/review-cycles')
}

export async function reassignReviewer(reviewId: string, newReviewerId: string) {
  await requireAdmin()
  await prisma.cycleReview.update({
    where: { id: reviewId },
    data: { reviewerId: newReviewerId || null },
  })
  revalidatePath('/dashboard/admin/review-cycles')
}
