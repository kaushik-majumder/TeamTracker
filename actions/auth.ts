'use server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { createSession, deleteSession } from '@/lib/session'
import { redirect } from 'next/navigation'

const LoginSchema = z.object({
  email: z.email({ error: 'Invalid email address' }),
  password: z.string().min(1, { error: 'Password is required' }),
})

export type LoginState = {
  errors?: { email?: string[]; password?: string[] }
  message?: string
} | undefined

export async function login(state: LoginState, formData: FormData): Promise<LoginState> {
  const validated = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors }
  }

  const { email, password } = validated.data
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) return { message: 'Invalid email or password' }
  if (!user.password) {
    return { message: 'This account has not set a password yet — check your email for the invite.' }
  }
  if (!(await bcrypt.compare(password, user.password))) {
    return { message: 'Invalid email or password' }
  }

  await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role })
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}

// ─── Set password from invite link ───────────────────────────────────────────

const SetupPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, { error: 'Password must be at least 6 characters' }),
  confirm: z.string().min(1, { error: 'Please confirm your password' }),
}).refine((v) => v.password === v.confirm, {
  path: ['confirm'],
  error: 'Passwords do not match',
})

export type SetupState =
  | { errors?: { password?: string[]; confirm?: string[]; token?: string[] }; message?: string }
  | undefined

export async function setupPassword(state: SetupState, formData: FormData): Promise<SetupState> {
  const validated = SetupPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const { token, password } = validated.data
  const user = await prisma.user.findUnique({ where: { passwordSetupToken: token } })

  if (!user) {
    return { message: 'This invite link is invalid. Ask your admin to send a new one.' }
  }
  if (!user.passwordSetupExpiresAt || user.passwordSetupExpiresAt < new Date()) {
    return { message: 'This invite link has expired. Ask your admin to send a new one.' }
  }

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      passwordSetupToken: null,
      passwordSetupExpiresAt: null,
    },
  })

  await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role })
  redirect('/dashboard')
}
