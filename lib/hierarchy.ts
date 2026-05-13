import 'server-only'
import { Role } from '@prisma/client'
import { prisma } from './db'

/** Numeric weight for role comparisons. Higher = more authority. */
const ROLE_LEVEL: Record<Role, number> = {
  ADMIN: 100,
  MANAGING_DIRECTOR: 75,
  MANAGER: 50,
  TEAM_LEAD: 25,
}

export function levelOf(role: Role): number {
  return ROLE_LEVEL[role]
}

/** Returns the role that should approve a request recommended by `recommenderRole`. */
export function approverRoleFor(recommenderRole: Role): Role[] {
  switch (recommenderRole) {
    case 'TEAM_LEAD':
      return ['MANAGER']
    case 'MANAGER':
      return ['MANAGING_DIRECTOR']
    case 'MANAGING_DIRECTOR':
      return ['ADMIN']
    case 'ADMIN':
      return [] // admin requests don't go through approval
  }
}

/** What roles can a user with this role recommend (subject role)? */
export function canRecommendRoles(recommenderRole: Role): Role[] {
  switch (recommenderRole) {
    case 'TEAM_LEAD':
      return [] // leads recommend only Employees (team members), no User subjects
    case 'MANAGER':
      return ['TEAM_LEAD']
    case 'MANAGING_DIRECTOR':
      return ['TEAM_LEAD', 'MANAGER']
    case 'ADMIN':
      return ['TEAM_LEAD', 'MANAGER', 'MANAGING_DIRECTOR']
  }
}

/** Find users with the given role(s) who have access to this team. */
export async function findApproversForTeam(teamId: string, roles: Role[]) {
  if (roles.length === 0) return []
  const access = await prisma.teamAccess.findMany({
    where: { teamId, role: { in: roles } },
    include: { user: { select: { id: true, email: true, name: true } } },
  })
  return access.map((a) => ({ userId: a.user.id, email: a.user.email, name: a.user.name }))
}

/** Admins serve as the fallback approver pool when no role-specific approver exists. */
export async function findAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, name: true },
  })
  return admins.map((a) => ({ userId: a.id, email: a.email, name: a.name }))
}
