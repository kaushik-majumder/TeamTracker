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
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email, password } = validated.data
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { message: 'Invalid email or password' }
  }

  await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role })
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
