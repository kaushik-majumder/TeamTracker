'use server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth, requireTeamAccess, requireTeamAccessForEmployee } from '@/lib/auth'
import { validateEmailDomain } from '@/lib/email-validation'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const EmployeeSchema = z.object({
  name: z.string().min(1, { error: 'Name is required' }),
  email: z.email({ error: 'Invalid email' }),
  title: z.string().min(1, { error: 'Designation is required' }),
  joinDate: z.string().min(1, { error: 'Join date is required' }),
  teamId: z.string().min(1, { error: 'Team is required' }),
})

const UpdateEmployeeSchema = z.object({
  employeeId: z.string().min(1),
  name: z.string().min(1, { error: 'Name is required' }),
  email: z.email({ error: 'Invalid email' }),
  title: z.string().min(1, { error: 'Designation is required' }),
  joinDate: z.string().min(1, { error: 'Join date is required' }),
})

const PerformanceSchema = z.object({
  employeeId: z.string(),
  rating: z.coerce.number().int().min(1).max(5),
  notes: z.string().min(1, { error: 'Notes are required' }),
  period: z.string().min(1, { error: 'Period is required' }),
})

export async function addEmployee(_state: unknown, formData: FormData) {
  const validated = EmployeeSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    title: formData.get('title'),
    joinDate: formData.get('joinDate'),
    teamId: formData.get('teamId'),
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const domainError = await validateEmailDomain(validated.data.email)
  if (domainError) return { errors: { email: [domainError] } }

  await requireTeamAccess(validated.data.teamId)

  const { joinDate, ...rest } = validated.data
  const employee = await prisma.employee.create({
    data: { ...rest, joinDate: new Date(joinDate) },
  })
  revalidatePath(`/dashboard/teams/${rest.teamId}`)
  redirect(`/dashboard/teams/${rest.teamId}/members/${employee.id}`)
}

export async function updateEmployee(_state: unknown, formData: FormData) {
  const validated = UpdateEmployeeSchema.safeParse({
    employeeId: formData.get('employeeId'),
    name: formData.get('name'),
    email: formData.get('email'),
    title: formData.get('title'),
    joinDate: formData.get('joinDate'),
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const domainError = await validateEmailDomain(validated.data.email)
  if (domainError) return { errors: { email: [domainError] } }

  await requireTeamAccessForEmployee(validated.data.employeeId)

  const { employeeId, joinDate, ...rest } = validated.data
  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: { ...rest, joinDate: new Date(joinDate) },
  })
  revalidatePath(`/dashboard/teams/${updated.teamId}`)
  revalidatePath(`/dashboard/teams/${updated.teamId}/members/${employeeId}`)
  return { success: true }
}

export async function deleteEmployee(employeeId: string) {
  await requireTeamAccessForEmployee(employeeId)
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { teamId: true },
  })
  await prisma.employee.delete({ where: { id: employeeId } })
  if (emp) revalidatePath(`/dashboard/teams/${emp.teamId}`)
  revalidatePath('/dashboard/admin/users')
}

export async function markEmployeeAsLeft(employeeId: string, leftDate: string) {
  await requireTeamAccessForEmployee(employeeId)
  await prisma.employee.update({
    where: { id: employeeId },
    data: { status: 'LEFT', leftDate: new Date(leftDate) },
  })
  revalidatePath('/dashboard/teams')
}

export async function reactivateEmployee(employeeId: string) {
  await requireTeamAccessForEmployee(employeeId)
  await prisma.employee.update({
    where: { id: employeeId },
    data: { status: 'ACTIVE', leftDate: null },
  })
  revalidatePath('/dashboard/teams')
}

const MAX_FILE_BYTES = 3 * 1024 * 1024 // 3MB per file
const MAX_TOTAL_BYTES = 8 * 1024 * 1024 // 8MB total per record

export async function addPerformanceRecord(_state: unknown, formData: FormData) {
  const validated = PerformanceSchema.safeParse({
    employeeId: formData.get('employeeId'),
    rating: formData.get('rating'),
    notes: formData.get('notes'),
    period: formData.get('period'),
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const session = await requireTeamAccessForEmployee(validated.data.employeeId)

  // Parse attachments
  const files = formData.getAll('attachments').filter((f): f is File => f instanceof File && f.size > 0)
  let totalBytes = 0
  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) {
      return { message: `"${f.name}" is over 3MB — try a smaller file.` }
    }
    totalBytes += f.size
  }
  if (totalBytes > MAX_TOTAL_BYTES) {
    return { message: 'Attachments total over 8MB — please reduce the upload.' }
  }

  const attachmentRows = await Promise.all(
    files.map(async (f) => {
      const buffer = Buffer.from(await f.arrayBuffer())
      const dataUrl = `data:${f.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`
      return {
        filename: f.name,
        mimeType: f.type || 'application/octet-stream',
        sizeBytes: f.size,
        dataUrl,
      }
    })
  )

  await prisma.performanceRecord.create({
    data: {
      ...validated.data,
      createdBy: session.userId,
      attachments: { create: attachmentRows },
    },
  })
  revalidatePath(`/dashboard/teams`)
  return { success: true }
}

export async function deletePerformanceRecord(recordId: string) {
  const session = await requireAuth()
  const record = await prisma.performanceRecord.findUnique({
    where: { id: recordId },
    select: { employeeId: true },
  })
  if (!record) return

  // Reuse the employee-level access check
  await requireTeamAccessForEmployee(record.employeeId)
  await prisma.performanceRecord.delete({ where: { id: recordId } })
  revalidatePath('/dashboard/teams')
}
