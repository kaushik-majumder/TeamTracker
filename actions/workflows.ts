'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth, requireTeamAccess } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { notify, notifyAll } from '@/lib/notifications'
import { workflowSubmittedEmail, workflowReviewedEmail } from '@/lib/email'
import { approverRoleFor, findApproversForTeam, findAdmins } from '@/lib/hierarchy'
import { Role, WorkflowStatus } from '@prisma/client'

const APP_URL = process.env.APP_URL || 'http://localhost:3000'

// Subject is either an Employee (team_member) or a User (lead/manager)
const SubjectSchema = z
  .object({
    employeeId: z.string().optional(),
    subjectUserId: z.string().optional(),
  })
  .refine((v) => !!v.employeeId !== !!v.subjectUserId, {
    message: 'Provide exactly one of employeeId or subjectUserId',
  })

const PromotionSchema = z
  .object({
    employeeId: z.string().optional(),
    subjectUserId: z.string().optional(),
    teamId: z.string().min(1),
    currentTitle: z.string().min(1, { error: 'Current title is required' }),
    proposedTitle: z.string().min(1, { error: 'Proposed title is required' }),
    justification: z.string().min(10, { error: 'Please provide a detailed justification' }),
  })
  .refine((v) => !!v.employeeId !== !!v.subjectUserId, {
    message: 'Choose a single subject',
    path: ['employeeId'],
  })

const SalaryHikeSchema = z
  .object({
    employeeId: z.string().optional(),
    subjectUserId: z.string().optional(),
    teamId: z.string().min(1),
    currentSalary: z.coerce.number().positive({ error: 'Enter current salary' }),
    proposedSalary: z.coerce.number().positive({ error: 'Enter proposed salary' }),
    justification: z.string().min(10, { error: 'Please provide a detailed justification' }),
  })
  .refine((v) => !!v.employeeId !== !!v.subjectUserId, {
    message: 'Choose a single subject',
    path: ['employeeId'],
  })

const ReviewSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().optional(),
})

/** Returns the recommender's role on this team, or null if no access. */
async function getRecommenderTeamRole(userId: string, teamId: string, userBaseRole: Role) {
  // Admin can recommend on any team — they don't need TeamAccess for that.
  if (userBaseRole === 'ADMIN') return 'ADMIN' as const
  const access = await prisma.teamAccess.findUnique({
    where: { userId_teamId: { userId, teamId } },
  })
  return access?.role ?? null
}

/** Resolves the subject's display name + email, for notifications. */
async function resolveSubject(opts: { employeeId?: string; subjectUserId?: string }) {
  if (opts.employeeId) {
    const e = await prisma.employee.findUnique({
      where: { id: opts.employeeId },
      select: { id: true, name: true, email: true, title: true, teamId: true },
    })
    if (!e) return null
    return { kind: 'employee' as const, ...e }
  }
  if (opts.subjectUserId) {
    const u = await prisma.user.findUnique({
      where: { id: opts.subjectUserId },
      select: { id: true, name: true, email: true, role: true },
    })
    if (!u) return null
    return { kind: 'user' as const, ...u, title: u.role }
  }
  return null
}

export async function createPromotionRequest(_state: unknown, formData: FormData) {
  const validated = PromotionSchema.safeParse({
    employeeId: formData.get('employeeId') || undefined,
    subjectUserId: formData.get('subjectUserId') || undefined,
    teamId: formData.get('teamId'),
    currentTitle: formData.get('currentTitle'),
    proposedTitle: formData.get('proposedTitle'),
    justification: formData.get('justification'),
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const session = await requireTeamAccess(validated.data.teamId)
  const recommenderRole = await getRecommenderTeamRole(session.userId, validated.data.teamId, session.role)
  if (!recommenderRole) return { message: 'You do not have access to this team' }

  const subject = await resolveSubject(validated.data)
  if (!subject) return { message: 'Subject not found' }

  // Create the request
  const data = validated.data
  const request = await prisma.promotionRequest.create({
    data: {
      employeeId: data.employeeId ?? null,
      subjectUserId: data.subjectUserId ?? null,
      teamId: data.teamId,
      recommendedBy: session.userId,
      currentTitle: data.currentTitle,
      proposedTitle: data.proposedTitle,
      justification: data.justification,
    },
  })

  // Route to the right approvers
  const approverRoles = approverRoleFor(recommenderRole)
  let approvers = await findApproversForTeam(data.teamId, approverRoles)
  // Fall back to admins if no qualified approver exists yet
  if (approvers.length === 0) approvers = await findAdmins()

  await notifyAll(
    approvers.map((a) => ({ userId: a.userId, email: a.email })),
    {
      type: 'PROMOTION_SUBMITTED',
      title: 'New promotion request',
      message: `${session.name} recommended ${subject.name} for promotion to ${data.proposedTitle}`,
      link: '/dashboard/workflows',
      emailFor: (m) => {
        const recipient = approvers.find((x) => x.userId === m.userId)!
        return workflowSubmittedEmail({
          recipientName: recipient.name,
          recommenderName: session.name,
          employeeName: subject.name,
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
    employeeId: formData.get('employeeId') || undefined,
    subjectUserId: formData.get('subjectUserId') || undefined,
    teamId: formData.get('teamId'),
    currentSalary: formData.get('currentSalary'),
    proposedSalary: formData.get('proposedSalary'),
    justification: formData.get('justification'),
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const session = await requireTeamAccess(validated.data.teamId)
  const recommenderRole = await getRecommenderTeamRole(session.userId, validated.data.teamId, session.role)
  if (!recommenderRole) return { message: 'You do not have access to this team' }

  const subject = await resolveSubject(validated.data)
  if (!subject) return { message: 'Subject not found' }

  const data = validated.data
  const request = await prisma.salaryHikeRequest.create({
    data: {
      employeeId: data.employeeId ?? null,
      subjectUserId: data.subjectUserId ?? null,
      teamId: data.teamId,
      recommendedBy: session.userId,
      currentSalary: data.currentSalary,
      proposedSalary: data.proposedSalary,
      justification: data.justification,
    },
  })

  const approverRoles = approverRoleFor(recommenderRole)
  let approvers = await findApproversForTeam(data.teamId, approverRoles)
  if (approvers.length === 0) approvers = await findAdmins()

  const pct = Math.round(((data.proposedSalary - data.currentSalary) / data.currentSalary) * 100)

  await notifyAll(
    approvers.map((a) => ({ userId: a.userId, email: a.email })),
    {
      type: 'SALARY_SUBMITTED',
      title: 'New salary hike request',
      message: `${session.name} recommended a ${pct}% raise for ${subject.name}`,
      link: '/dashboard/workflows',
      emailFor: (m) => {
        const recipient = approvers.find((x) => x.userId === m.userId)!
        return workflowSubmittedEmail({
          recipientName: recipient.name,
          recommenderName: session.name,
          employeeName: subject.name,
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

// ─── Reviews ────────────────────────────────────────────────────────────────

/** Verifies the current user is qualified to review this request. */
async function canReviewRequest(opts: {
  reviewerId: string
  reviewerRole: Role
  requestTeamId: string
  recommenderId: string
}): Promise<boolean> {
  if (opts.reviewerRole === 'ADMIN') return true
  // Reviewer must have TeamAccess to the team
  const access = await prisma.teamAccess.findUnique({
    where: { userId_teamId: { userId: opts.reviewerId, teamId: opts.requestTeamId } },
  })
  if (!access) return false

  // Find the recommender's role on the same team
  const recAccess = await prisma.teamAccess.findUnique({
    where: { userId_teamId: { userId: opts.recommenderId, teamId: opts.requestTeamId } },
  })
  if (!recAccess) return false

  // Reviewer's role must be in the approver pool for the recommender's role
  const acceptable = approverRoleFor(recAccess.role)
  return acceptable.includes(access.role)
}

export async function reviewPromotionRequest(_state: unknown, formData: FormData) {
  const validated = ReviewSchema.safeParse({
    requestId: formData.get('requestId'),
    status: formData.get('status'),
    reviewNote: formData.get('reviewNote') || undefined,
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const session = await requireAuth()
  const existing = await prisma.promotionRequest.findUnique({
    where: { id: validated.data.requestId },
    select: { teamId: true, recommendedBy: true, status: true },
  })
  if (!existing) return { message: 'Request not found' }
  if (existing.status !== 'PENDING') return { message: 'Already reviewed' }

  const allowed = await canReviewRequest({
    reviewerId: session.userId,
    reviewerRole: session.role,
    requestTeamId: existing.teamId,
    recommenderId: existing.recommendedBy,
  })
  if (!allowed) return { message: 'Not authorized to review this request' }

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
      subjectUser: { select: { name: true } },
      recommender: { select: { id: true, email: true, name: true } },
    },
  })

  const subjectName = updated.employee?.name ?? updated.subjectUser?.name ?? 'team member'

  await notify({
    userId: updated.recommendedBy,
    type: 'PROMOTION_REVIEWED',
    title: `Promotion ${status.toLowerCase()}`,
    message: `${session.name} ${status.toLowerCase()} your promotion request for ${subjectName}`,
    link: '/dashboard/workflows',
    email: {
      to: updated.recommender.email,
      ...workflowReviewedEmail({
        recipientName: updated.recommender.name,
        reviewerName: session.name,
        employeeName: subjectName,
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

  const session = await requireAuth()
  const existing = await prisma.salaryHikeRequest.findUnique({
    where: { id: validated.data.requestId },
    select: { teamId: true, recommendedBy: true, status: true },
  })
  if (!existing) return { message: 'Request not found' }
  if (existing.status !== 'PENDING') return { message: 'Already reviewed' }

  const allowed = await canReviewRequest({
    reviewerId: session.userId,
    reviewerRole: session.role,
    requestTeamId: existing.teamId,
    recommenderId: existing.recommendedBy,
  })
  if (!allowed) return { message: 'Not authorized to review this request' }

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
      subjectUser: { select: { name: true } },
      recommender: { select: { id: true, email: true, name: true } },
    },
  })

  const subjectName = updated.employee?.name ?? updated.subjectUser?.name ?? 'team member'
  const pct = Math.round(((updated.proposedSalary - updated.currentSalary) / updated.currentSalary) * 100)

  await notify({
    userId: updated.recommendedBy,
    type: 'SALARY_REVIEWED',
    title: `Salary hike ${status.toLowerCase()}`,
    message: `${session.name} ${status.toLowerCase()} your salary hike request for ${subjectName}`,
    link: '/dashboard/workflows',
    email: {
      to: updated.recommender.email,
      ...workflowReviewedEmail({
        recipientName: updated.recommender.name,
        reviewerName: session.name,
        employeeName: subjectName,
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
