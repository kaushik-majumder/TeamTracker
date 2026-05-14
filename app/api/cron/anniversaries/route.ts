import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
  const year = today.getFullYear()

  // Active employees whose joinDate has the same month + day as today (and joined in a prior year)
  const employees = await prisma.employee.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, email: true, joinDate: true, teamId: true, team: { select: { name: true } } },
  })

  const anniversaries = employees.filter((e) => {
    const j = new Date(e.joinDate)
    return j.getMonth() + 1 === month && j.getDate() === day && j.getFullYear() < year
  })

  const results: { name: string; status: string; cc?: string[] }[] = []

  for (const emp of anniversaries) {
    const alreadySent = await prisma.anniversaryEmail.findUnique({
      where: { employeeId_year: { employeeId: emp.id, year } },
    })
    if (alreadySent) continue

    const yearsAtCompany = year - new Date(emp.joinDate).getFullYear()

    // Pull the team's leadership chain — leads, managers, and MDs all get CC'd
    const teamAccess = await prisma.teamAccess.findMany({
      where: { teamId: emp.teamId },
      include: { user: { select: { email: true } } },
    })
    const cc = [...new Set(teamAccess.map((a) => a.user.email))]

    try {
      const res = await sendEmail({
        to: emp.email,
        cc,
        subject: `Happy ${yearsAtCompany}-Year Work Anniversary, ${emp.name}!`,
        html: `
          <div style="font-family:-apple-system,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#1f2937;">
            <h2 style="margin-top:0;">🎉 Happy Work Anniversary, ${emp.name}!</h2>
            <p>Today marks your <strong>${yearsAtCompany}-year</strong> anniversary with us on <strong>${emp.team.name}</strong>.</p>
            <p>Thank you for everything you bring — your dedication and hard work are truly appreciated.</p>
            <p>Here's to many more great years ahead!</p>
            <p style="color:#9ca3af;font-size:12px;margin-top:32px;">— Team eXp Realty</p>
          </div>
        `,
      })

      if (res.sent !== false || res.reason === 'smtp-not-configured') {
        // We record the row even in 'smtp-not-configured' mode so we don't replay
        // every day during local dev. To force a re-send while debugging, clear
        // the AnniversaryEmail row manually.
        await prisma.anniversaryEmail.create({
          data: { employeeId: emp.id, year },
        })
      }

      results.push({
        name: emp.name,
        status: res.sent === false ? `skipped (${res.reason})` : 'sent',
        cc,
      })
    } catch (err) {
      console.error(`[cron] failed for ${emp.name}:`, err)
      results.push({ name: emp.name, status: 'failed' })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
