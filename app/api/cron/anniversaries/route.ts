import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
  const year = today.getFullYear()

  const employees = await prisma.employee.findMany({
    select: { id: true, name: true, email: true, joinDate: true },
  })

  const anniversaries = employees.filter((emp) => {
    const join = new Date(emp.joinDate)
    return join.getMonth() + 1 === month && join.getDate() === day && join.getFullYear() < year
  })

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  const results: { name: string; status: string }[] = []

  for (const emp of anniversaries) {
    const alreadySent = await prisma.anniversaryEmail.findUnique({
      where: { employeeId_year: { employeeId: emp.id, year } },
    })
    if (alreadySent) continue

    const yearsAtCompany = year - new Date(emp.joinDate).getFullYear()

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM ?? 'teamtracker@company.com',
        to: emp.email,
        subject: `Happy ${yearsAtCompany}-Year Work Anniversary, ${emp.name}!`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;">
            <h2>🎉 Happy Work Anniversary, ${emp.name}!</h2>
            <p>Today marks your <strong>${yearsAtCompany}-year</strong> anniversary with us.
            Thank you for everything you bring to the team — your dedication and hard work are truly valued.</p>
            <p>Here's to many more great years ahead!</p>
            <p style="color:#888;font-size:12px;margin-top:32px;">— TeamTracker</p>
          </div>
        `,
      })

      await prisma.anniversaryEmail.create({
        data: { employeeId: emp.id, year },
      })
      results.push({ name: emp.name, status: 'sent' })
    } catch (err) {
      results.push({ name: emp.name, status: 'failed' })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
