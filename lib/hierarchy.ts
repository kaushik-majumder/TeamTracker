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

/**
 * Returns the user's explicit direct supervisor (via reportsToId).
 * If unset, returns null and callers should fall back to team-based routing.
 */
export async function getDirectSupervisor(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      reportsTo: { select: { id: true, email: true, name: true } },
    },
  })
  if (!u?.reportsTo) return null
  return { userId: u.reportsTo.id, email: u.reportsTo.email, name: u.reportsTo.name }
}

/**
 * Can `viewerId` edit/delete `targetUserId`?
 * Rule: admin bypasses everything; otherwise, viewer and target must share
 * a team where viewer's per-team role outranks the target's.
 */
export async function canManageUser(opts: {
  viewerId: string
  viewerBaseRole: Role
  targetUserId: string
}): Promise<boolean> {
  if (opts.viewerId === opts.targetUserId) return false // no self-edits via this path
  if (opts.viewerBaseRole === 'ADMIN') return true

  // Don't allow editing of other admins by non-admins
  const target = await prisma.user.findUnique({
    where: { id: opts.targetUserId },
    select: { role: true },
  })
  if (!target || target.role === 'ADMIN') return false

  const [viewerAccess, targetAccess] = await Promise.all([
    prisma.teamAccess.findMany({
      where: { userId: opts.viewerId },
      select: { teamId: true, role: true },
    }),
    prisma.teamAccess.findMany({
      where: { userId: opts.targetUserId },
      select: { teamId: true, role: true },
    }),
  ])

  for (const v of viewerAccess) {
    const t = targetAccess.find((x) => x.teamId === v.teamId)
    if (t && levelOf(v.role) > levelOf(t.role)) return true
  }
  return false
}

/** Admins serve as the fallback approver pool when no role-specific approver exists. */
export async function findAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, name: true },
  })
  return admins.map((a) => ({ userId: a.id, email: a.email, name: a.name }))
}
