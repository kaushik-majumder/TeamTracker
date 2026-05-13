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

export async function addPerformanceRecord(_state: unknown, formData: FormData) {
  const validated = PerformanceSchema.safeParse({
    employeeId: formData.get('employeeId'),
    rating: formData.get('rating'),
    notes: formData.get('notes'),
    period: formData.get('period'),
  })
  if (!validated.success) return { errors: z.flattenError(validated.error).fieldErrors }

  const session = await requireTeamAccessForEmployee(validated.data.employeeId)
  await prisma.performanceRecord.create({
    data: { ...validated.data, createdBy: session.userId },
  })
  revalidatePath(`/dashboard/teams`)
  return { success: true }
}
