import 'server-only'
import { getSession } from './session'
import { redirect } from 'next/navigation'
import { Role } from '@prisma/client'

export async function requireAuth() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

export async function requireRole(role: Role) {
  const session = await requireAuth()
  if (session.role !== role) redirect('/dashboard')
  return session
}

export async function requireAdmin() {
  return requireRole(Role.ADMIN)
}

// Managers OR admins can approve workflows, manage teams, etc.
export async function requireManagerOrAdmin() {
  const session = await requireAuth()
  if (session.role !== Role.MANAGER && session.role !== Role.ADMIN) {
    redirect('/dashboard')
  }
  return session
}
