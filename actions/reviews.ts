'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

const ReviewSchema = z.object({
  reviewId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  goals: z.string().optional(),
  action: z.enum(['save', 'submit']).default('save'),
})

export async function submitCycleReview(_state: unknown, formData: FormData) {
  const session = await requireAuth()
  const validated = ReviewSchema.safeParse({
    reviewId: formData.get('reviewId'),
    rating: formData.get('rating') || undefined,
    strengths: (formData.get('strengths') as string) || undefined,
    improvements: (formData.get('improvements') as string) || undefined,
    goals: (formData.get('goals') as string) || undefined,
    action: formData.get('action') || 'save',
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const { reviewId, rating, strengths, improvements, goals, action } = validated.data

  // Verify reviewer matches and cycle is OPEN
  const review = await prisma.cycleReview.findUnique({
    where: { id: reviewId },
    include: { cycle: { select: { status: true } } },
  })
  if (!review) return { message: 'Review not found' }
  if (session.role !== 'ADMIN' && review.reviewerId !== session.userId) {
    return { message: 'You are not assigned to this review' }
  }
  if (review.cycle.status !== 'OPEN') {
    return { message: 'This review cycle is no longer accepting submissions' }
  }

  if (action === 'submit') {
    // Submit requires rating + at least one comment field
    if (!rating) {
      return { errors: { rating: ['Rating is required to submit'] } }
    }
    if (!strengths && !improvements && !goals) {
      return { errors: { strengths: ['Add at least one comment before submitting'] } }
    }
  }

  await prisma.cycleReview.update({
    where: { id: reviewId },
    data: {
      rating: rating ?? null,
      strengths: strengths ?? null,
      improvements: improvements ?? null,
      goals: goals ?? null,
      status: action === 'submit' ? 'COMPLETED' : 'IN_PROGRESS',
      submittedAt: action === 'submit' ? new Date() : null,
    },
  })

  await audit({
    actorId: session.userId,
    action: action === 'submit' ? 'review.submit' : 'review.save',
    entityType: 'CycleReview',
    entityId: reviewId,
    details: { rating, hasComments: !!(strengths || improvements || goals) },
  })

  revalidatePath('/dashboard/reviews')
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/admin/review-cycles')
  return { success: true, submitted: action === 'submit' }
}
