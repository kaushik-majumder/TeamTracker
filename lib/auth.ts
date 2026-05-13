import 'server-only'
import { getSession } from './session'
import { redirect } from 'next/navigation'
import { Role } from '@prisma/client'
import { prisma } from './db'

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

export async function requireManagerOrAdmin() {
  const session = await requireAuth()
  if (session.role !== Role.MANAGER && session.role !== Role.ADMIN) {
    redirect('/dashboard')
  }
  return session
}

/** Allows admins, or users with TeamAccess to this team. */
export async function requireTeamAccess(teamId: string) {
  const session = await requireAuth()
  if (session.role === Role.ADMIN) return session

  const access = await prisma.teamAccess.findUnique({
    where: { userId_teamId: { userId: session.userId, teamId } },
  })
  if (!access) redirect('/dashboard')
  return session
}

/** Resolves the employee's team and verifies access. */
export async function requireTeamAccessForEmployee(employeeId: string) {
  const session = await requireAuth()
  if (session.role === Role.ADMIN) return session

  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { teamId: true },
  })
  if (!emp) redirect('/dashboard')

  const access = await prisma.teamAccess.findUnique({
    where: { userId_teamId: { userId: session.userId, teamId: emp.teamId } },
  })
  if (!access) redirect('/dashboard')
  return session
}
