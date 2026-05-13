'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { validateEmailDomain } from '@/lib/email-validation'
import { createSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

// 600KB cap on the stored data URL — leaves headroom for ~450KB of image bytes
// after base64 encoding. The form resizes uploads to 256×256 JPEG before sending,
// so a typical avatar is ~20–40KB.
const MAX_IMAGE_BYTES = 600_000

const ProfileSchema = z.object({
  name: z.string().min(1, { error: 'Name is required' }),
  email: z.email({ error: 'Invalid email' }),
  gender: z.string().optional(),
  profileImageUrl: z.string().optional(),
}).superRefine((v, ctx) => {
  if (!v.profileImageUrl) return
  const url = v.profileImageUrl
  const isHttp = /^https?:\/\//i.test(url)
  const isDataImage = /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(url)
  if (!isHttp && !isDataImage) {
    ctx.addIssue({
      code: 'custom',
      path: ['profileImageUrl'],
      message: 'Unsupported image format',
    })
  }
  if (isDataImage && url.length > MAX_IMAGE_BYTES) {
    ctx.addIssue({
      code: 'custom',
      path: ['profileImageUrl'],
      message: 'Image is too large — try a smaller file',
    })
  }
})

export async function updateProfile(_state: unknown, formData: FormData) {
  const session = await requireAuth()
  const validated = ProfileSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    gender: (formData.get('gender') as string) || undefined,
    profileImageUrl: (formData.get('profileImageUrl') as string) || undefined,
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const { name, email, gender, profileImageUrl } = validated.data

  const current = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  })
  if (!current) return { message: 'User not found' }

  // Validate email domain only if changed
  if (current.email !== email) {
    const domainError = await validateEmailDomain(email)
    if (domainError) return { errors: { email: [domainError] } }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing && existing.id !== session.userId) {
      return { message: 'Another user already has that email' }
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: {
      name,
      email,
      gender: gender || null,
      profileImageUrl: profileImageUrl || null,
    },
  })

  // Refresh the JWT session so the top bar / sidebar reflect the new name/email
  await createSession({
    userId: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role,
  })

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}
