'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth, requireManagerOrAdmin, requireTeamAccess } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { notify, notifyAll } from '@/lib/notifications'
import { workflowSubmittedEmail, workflowReviewedEmail } from '@/lib/email'
import { WorkflowStatus } from '@prisma/client'

const APP_URL = process.env.APP_URL || 'http://localhost:3000'

const PromotionSchema = z.object({
  employeeId: z.string().min(1),
  teamId: z.string().min(1),
  currentTitle: z.string().min(1, { error: 'Current title is required' }),
  proposedTitle: z.string().min(1, { error: 'Proposed title is required' }),
  justification: z.string().min(10, { error: 'Please provide a detailed justification' }),
})

const SalaryHikeSchema = z.object({
  employeeId: z.string().min(1),
  teamId: z.string().min(1),
  currentSalary: z.coerce.number().positive({ error: 'Enter current salary' }),
  proposedSalary: z.coerce.number().positive({ error: 'Enter proposed salary' }),
  justification: z.string().min(10, { error: 'Please provide a detailed justification' }),
})

const ReviewSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().optional(),
})

async function getTeamManagers(teamId: string) {
  const access = await prisma.teamAccess.findMany({
    where: { teamId, role: 'MANAGER' },
    include: { user: { select: { id: true, email: true, name: true } } },
  })
  return access.map((a) => ({ userId: a.user.id, email: a.user.email, name: a.user.name }))
}

export async function createPromotionRequest(_state: unknown, formData: FormData) {
  const validated = PromotionSchema.safeParse({
    employeeId: formData.get('employeeId'),
    teamId: formData.get('teamId'),
    currentTitle: formData.get('currentTitle'),
    proposedTitle: formData.get('proposedTitle'),
    justification: formData.get('justification'),
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const session = await requireTeamAccess(validated.data.teamId)
  const data = validated.data

  const [request, employee] = await Promise.all([
    prisma.promotionRequest.create({
      data: { ...data, recommendedBy: session.userId },
    }),
    prisma.employee.findUnique({ where: { id: data.employeeId }, select: { name: true } }),
  ])

  const managers = await getTeamManagers(data.teamId)
  const employeeName = employee?.name ?? 'a team member'

  await notifyAll(
    managers.map((m) => ({ userId: m.userId, email: m.email })),
    {
      type: 'PROMOTION_SUBMITTED',
      title: 'New promotion request',
      message: `${session.name} recommended ${employeeName} for promotion to ${data.proposedTitle}`,
      link: '/dashboard/workflows',
      emailFor: (m) => {
        const manager = managers.find((x) => x.userId === m.userId)!
        return workflowSubmittedEmail({
          recipientName: manager.name,
          recommenderName: session.name,
          employeeName,
          workflowType: 'Promotion',
          detail: `${data.currentTitle} → ${data.proposedTitle}`,
          justification: data.justification,
          appUrl: APP_URL,
        })
      },
    }
  )

  revalidatePath('/dashboard/workflows')
  revalidatePath('/dashboard')
  return { success: true, requestId: request.id }
}

export async function createSalaryHikeRequest(_state: unknown, formData: FormData) {
  const validated = SalaryHikeSchema.safeParse({
    employeeId: formData.get('employeeId'),
    teamId: formData.get('teamId'),
    currentSalary: formData.get('currentSalary'),
    proposedSalary: formData.get('proposedSalary'),
    justification: formData.get('justification'),
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const session = await requireTeamAccess(validated.data.teamId)
  const data = validated.data

  const [request, employee] = await Promise.all([
    prisma.salaryHikeRequest.create({
      data: { ...data, recommendedBy: session.userId },
    }),
    prisma.employee.findUnique({ where: { id: data.employeeId }, select: { name: true } }),
  ])

  const managers = await getTeamManagers(data.teamId)
  const employeeName = employee?.name ?? 'a team member'
  const pct = Math.round(((data.proposedSalary - data.currentSalary) / data.currentSalary) * 100)

  await notifyAll(
    managers.map((m) => ({ userId: m.userId, email: m.email })),
    {
      type: 'SALARY_SUBMITTED',
      title: 'New salary hike request',
      message: `${session.name} recommended a ${pct}% raise for ${employeeName}`,
      link: '/dashboard/workflows',
      emailFor: (m) => {
        const manager = managers.find((x) => x.userId === m.userId)!
        return workflowSubmittedEmail({
          recipientName: manager.name,
          recommenderName: session.name,
          employeeName,
          workflowType: 'Salary Hike',
          detail: `$${data.currentSalary.toLocaleString()} → $${data.proposedSalary.toLocaleString()} (+${pct}%)`,
          justification: data.justification,
          appUrl: APP_URL,
        })
      },
    }
  )

  revalidatePath('/dashboard/workflows')
  revalidatePath('/dashboard')
  return { success: true, requestId: request.id }
}

export async function reviewPromotionRequest(_state: unknown, formData: FormData) {
  const validated = ReviewSchema.safeParse({
    requestId: formData.get('requestId'),
    status: formData.get('status'),
    reviewNote: formData.get('reviewNote') || undefined,
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const session = await requireManagerOrAdmin()
  const { requestId, status, reviewNote } = validated.data

  const updated = await prisma.promotionRequest.update({
    where: { id: requestId },
    data: {
      status: status as WorkflowStatus,
      reviewedBy: session.userId,
      reviewNote,
      reviewedAt: new Date(),
    },
    include: {
      employee: { select: { name: true } },
      recommender: { select: { id: true, email: true, name: true } },
    },
  })

  await notify({
    userId: updated.recommendedBy,
    type: 'PROMOTION_REVIEWED',
    title: `Promotion ${status.toLowerCase()}`,
    message: `${session.name} ${status.toLowerCase()} your promotion request for ${updated.employee.name}`,
    link: '/dashboard/workflows',
    email: {
      to: updated.recommender.email,
      ...workflowReviewedEmail({
        recipientName: updated.recommender.name,
        reviewerName: session.name,
        employeeName: updated.employee.name,
        workflowType: 'Promotion',
        decision: status as 'APPROVED' | 'REJECTED',
        detail: `${updated.currentTitle} → ${updated.proposedTitle}`,
        reviewNote,
        appUrl: APP_URL,
      }),
    },
  })

  revalidatePath('/dashboard/workflows')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function reviewSalaryHikeRequest(_state: unknown, formData: FormData) {
  const validated = ReviewSchema.safeParse({
    requestId: formData.get('requestId'),
    status: formData.get('status'),
    reviewNote: formData.get('reviewNote') || undefined,
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const session = await requireManagerOrAdmin()
  const { requestId, status, reviewNote } = validated.data

  const updated = await prisma.salaryHikeRequest.update({
    where: { id: requestId },
    data: {
      status: status as WorkflowStatus,
      reviewedBy: session.userId,
      reviewNote,
      reviewedAt: new Date(),
    },
    include: {
      employee: { select: { name: true } },
      recommender: { select: { id: true, email: true, name: true } },
    },
  })

  const pct = Math.round(((updated.proposedSalary - updated.currentSalary) / updated.currentSalary) * 100)

  await notify({
    userId: updated.recommendedBy,
    type: 'SALARY_REVIEWED',
    title: `Salary hike ${status.toLowerCase()}`,
    message: `${session.name} ${status.toLowerCase()} your salary hike request for ${updated.employee.name}`,
    link: '/dashboard/workflows',
    email: {
      to: updated.recommender.email,
      ...workflowReviewedEmail({
        recipientName: updated.recommender.name,
        reviewerName: session.name,
        employeeName: updated.employee.name,
        workflowType: 'Salary Hike',
        decision: status as 'APPROVED' | 'REJECTED',
        detail: `$${updated.currentSalary.toLocaleString()} → $${updated.proposedSalary.toLocaleString()} (+${pct}%)`,
        reviewNote,
        appUrl: APP_URL,
      }),
    },
  })

  revalidatePath('/dashboard/workflows')
  revalidatePath('/dashboard')
  return { success: true }
}
