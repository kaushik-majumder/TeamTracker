import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format, differenceInYears, differenceInMonths } from 'date-fns'
import { AddPerformanceForm } from './AddPerformanceForm'
import { WorkflowButtons } from './WorkflowButtons'
import { EmployeeStatusButton } from './EmployeeStatusButton'
import { EditMemberButton } from './EditMemberButton'
import { DeleteMemberButton } from './DeleteMemberButton'
import { PerformanceRecordItem } from './PerformanceRecordItem'

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string; memberId: string }>
}) {
  const { id, memberId } = await params
  const session = await requireAuth()

  const employee = await prisma.employee.findFirst({
    where:
      session.role === 'ADMIN'
        ? { id: memberId, teamId: id }
        : { id: memberId, teamId: id, team: { teamAccess: { some: { userId: session.userId } } } },
    include: {
      team: true,
      performanceRecords: {
        include: {
          author: { select: { name: true } },
          attachments: { select: { id: true, filename: true, mimeType: true, sizeBytes: true, dataUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      promotionRequests: { orderBy: { createdAt: 'desc' }, take: 3 },
      salaryRequests: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
  })

  if (!employee) notFound()

  const today = new Date()
  const years = differenceInYears(today, employee.joinDate)
  const months = differenceInMonths(today, employee.joinDate) % 12

  const statusColor = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/dashboard/teams/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← {employee.team.name}
        </Link>
        <div className="flex items-start justify-between mt-2 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{employee.name}</h1>
              {employee.status === 'LEFT' && (
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                  Former employee
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{employee.title}</p>
            <p className="text-xs text-gray-400 mt-1">
              Joined {format(employee.joinDate, 'MMMM d, yyyy')} · {years}y {months}m tenure
              {employee.status === 'LEFT' && employee.leftDate && (
                <span> · Left {format(employee.leftDate, 'MMM d, yyyy')}</span>
              )}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {employee.status === 'ACTIVE' && (
              <WorkflowButtons
                employeeId={employee.id}
                teamId={id}
                currentTitle={employee.title}
                role={session.role}
              />
            )}
            <div className="flex flex-wrap gap-2 justify-end">
              <EditMemberButton
                employeeId={employee.id}
                defaultName={employee.name}
                defaultEmail={employee.email}
                defaultTitle={employee.title}
                defaultJoinDate={employee.joinDate.toISOString().split('T')[0]}
              />
              <EmployeeStatusButton employeeId={employee.id} status={employee.status} />
              <DeleteMemberButton employeeId={employee.id} teamId={id} name={employee.name} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Records */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Performance</h2>
          <AddPerformanceForm employeeId={employee.id} teamId={id} />

          {employee.performanceRecords.length === 0 ? (
            <p className="text-sm text-gray-400 mt-4">No records yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {employee.performanceRecords.map((rec) => (
                <PerformanceRecordItem
                  key={rec.id}
                  id={rec.id}
                  period={rec.period}
                  rating={rec.rating}
                  notes={rec.notes}
                  authorName={rec.author?.name ?? 'Former user'}
                  createdAt={rec.createdAt}
                  attachments={rec.attachments}
                />
              ))}
            </div>
          )}
        </div>

        {/* Workflow History */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Workflow History</h2>

          {employee.promotionRequests.length + employee.salaryRequests.length === 0 ? (
            <p className="text-sm text-gray-400">No workflows yet.</p>
          ) : (
            <div className="space-y-3">
              {employee.promotionRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Promotion</span>
                    <p className="text-xs text-gray-500">
                      {req.currentTitle} → {req.proposedTitle}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[req.status]}`}>
                    {req.status}
                  </span>
                </div>
              ))}
              {employee.salaryRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Salary Hike</span>
                    <p className="text-xs text-gray-500">
                      ${req.currentSalary.toLocaleString()} → ${req.proposedSalary.toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[req.status]}`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
