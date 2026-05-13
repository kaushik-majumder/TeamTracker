'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth, requireManagerOrAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { WorkflowStatus } from '@prisma/client'

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

export async function createPromotionRequest(_state: unknown, formData: FormData) {
  const session = await requireAuth()
  const validated = PromotionSchema.safeParse({
    employeeId: formData.get('employeeId'),
    teamId: formData.get('teamId'),
    currentTitle: formData.get('currentTitle'),
    proposedTitle: formData.get('proposedTitle'),
    justification: formData.get('justification'),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  await prisma.promotionRequest.create({
    data: { ...validated.data, recommendedBy: session.userId },
  })
  revalidatePath('/dashboard/workflows')
  return { success: true }
}

export async function createSalaryHikeRequest(_state: unknown, formData: FormData) {
  const session = await requireAuth()
  const validated = SalaryHikeSchema.safeParse({
    employeeId: formData.get('employeeId'),
    teamId: formData.get('teamId'),
    currentSalary: formData.get('currentSalary'),
    proposedSalary: formData.get('proposedSalary'),
    justification: formData.get('justification'),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  await prisma.salaryHikeRequest.create({
    data: { ...validated.data, recommendedBy: session.userId },
  })
  revalidatePath('/dashboard/workflows')
  return { success: true }
}

export async function reviewPromotionRequest(_state: unknown, formData: FormData) {
  const session = await requireManagerOrAdmin()
  const validated = ReviewSchema.safeParse({
    requestId: formData.get('requestId'),
    status: formData.get('status'),
    reviewNote: formData.get('reviewNote') || undefined,
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { requestId, status, reviewNote } = validated.data
  await prisma.promotionRequest.update({
    where: { id: requestId },
    data: {
      status: status as WorkflowStatus,
      reviewedBy: session.userId,
      reviewNote,
      reviewedAt: new Date(),
    },
  })
  revalidatePath('/dashboard/workflows')
  return { success: true }
}

export async function reviewSalaryHikeRequest(_state: unknown, formData: FormData) {
  const session = await requireManagerOrAdmin()
  const validated = ReviewSchema.safeParse({
    requestId: formData.get('requestId'),
    status: formData.get('status'),
    reviewNote: formData.get('reviewNote') || undefined,
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { requestId, status, reviewNote } = validated.data
  await prisma.salaryHikeRequest.update({
    where: { id: requestId },
    data: {
      status: status as WorkflowStatus,
      reviewedBy: session.userId,
      reviewNote,
      reviewedAt: new Date(),
    },
  })
  revalidatePath('/dashboard/workflows')
  return { success: true }
}
