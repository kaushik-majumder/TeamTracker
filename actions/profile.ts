'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { validateEmailDomain } from '@/lib/email-validation'
import { createSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

const ProfileSchema = z.object({
  name: z.string().min(1, { error: 'Name is required' }),
  email: z.email({ error: 'Invalid email' }),
  gender: z.string().optional(),
  profileImageUrl: z.string().optional(),
}).refine(
  (v) => !v.profileImageUrl || /^https?:\/\//i.test(v.profileImageUrl),
  { path: ['profileImageUrl'], error: 'Image URL must start with http:// or https://' }
)

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
