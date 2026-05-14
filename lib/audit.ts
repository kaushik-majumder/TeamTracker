import 'server-only'
import { prisma } from './db'

export type AuditAction =
  // User management
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.password.setup'
  // Team management
  | 'team.create'
  | 'team.delete'
  | 'team.access.grant'
  | 'team.access.revoke'
  // Hierarchy
  | 'hierarchy.set'
  | 'hierarchy.resync'
  // Employees
  | 'employee.create'
  | 'employee.update'
  | 'employee.delete'
  | 'employee.markLeft'
  | 'employee.reactivate'
  // Performance
  | 'performance.add'
  | 'performance.delete'
  // Workflows
  | 'promotion.create'
  | 'promotion.review'
  | 'salary.create'
  | 'salary.review'
  // Review cycles
  | 'cycle.create'
  | 'cycle.open'
  | 'cycle.close'
  | 'cycle.delete'
  | 'review.save'
  | 'review.submit'

type AuditOpts = {
  actorId?: string | null
  action: AuditAction
  entityType?: string
  entityId?: string
  details?: Record<string, unknown>
}

/**
 * Records an audit log entry. Fire-and-forget: a failure here must never
 * break the underlying action, so errors are caught and logged.
 */
export async function audit(opts: AuditOpts) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: opts.actorId ?? null,
        action: opts.action,
        entityType: opts.entityType ?? null,
        entityId: opts.entityId ?? null,
        details: opts.details
          ? (JSON.parse(JSON.stringify(opts.details)) as object)
          : undefined,
      },
    })
  } catch (err) {
    console.error('[audit] failed to record:', opts.action, err)
  }
}
