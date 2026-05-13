import 'server-only'
import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null | undefined

function getTransporter() {
  if (transporter !== undefined) return transporter

  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  // Treat the .env.example placeholders as "not configured"
  const isConfigured =
    host &&
    user &&
    pass &&
    host !== 'smtp.example.com' &&
    !user.includes('your-email') &&
    !pass.includes('your-email')

  if (!isConfigured) {
    transporter = null
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user, pass },
  })
  return transporter
}

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  cc?: string[]
  bcc?: string[]
}) {
  const t = getTransporter()
  if (!t) {
    const cc = opts.cc && opts.cc.length ? ` (cc: ${opts.cc.join(', ')})` : ''
    console.warn(`[email] SMTP not configured — would have sent to ${opts.to}${cc}: ${opts.subject}`)
    return { sent: false, reason: 'smtp-not-configured' as const }
  }
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM ?? 'TeamTracker <noreply@teamtracker.dev>',
      to: opts.to,
      cc: opts.cc?.length ? opts.cc : undefined,
      bcc: opts.bcc?.length ? opts.bcc : undefined,
      subject: opts.subject,
      html: opts.html,
    })
    return { sent: true as const }
  } catch (err) {
    console.error('[email] failed to send:', err)
    return { sent: false, reason: 'send-failed' as const, error: err }
  }
}

// ─── Templates ──────────────────────────────────────────────────────────────

const baseStyle = `font-family: -apple-system, system-ui, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px; color: #1f2937;`

export function workflowSubmittedEmail(opts: {
  recipientName: string
  recommenderName: string
  employeeName: string
  workflowType: 'Promotion' | 'Salary Hike'
  detail: string
  justification: string
  appUrl?: string
}) {
  return {
    subject: `New ${opts.workflowType} request: ${opts.employeeName}`,
    html: `
      <div style="${baseStyle}">
        <h2 style="margin-top:0;">New ${opts.workflowType} Request</h2>
        <p>Hi ${opts.recipientName},</p>
        <p><strong>${opts.recommenderName}</strong> has recommended <strong>${opts.employeeName}</strong> for a ${opts.workflowType.toLowerCase()}.</p>
        <div style="background:#f3f4f6; padding:16px; border-radius:8px; margin:16px 0;">
          <p style="margin:0;"><strong>${opts.detail}</strong></p>
          <p style="margin:8px 0 0; color:#4b5563; font-style:italic;">"${opts.justification}"</p>
        </div>
        <p>Please review the request in TeamTracker.</p>
        ${opts.appUrl ? `<a href="${opts.appUrl}/dashboard/workflows" style="display:inline-block; padding:10px 20px; background:#2563eb; color:white; text-decoration:none; border-radius:8px; font-weight:500;">Review request →</a>` : ''}
        <p style="color:#9ca3af; font-size:12px; margin-top:32px;">— TeamTracker</p>
      </div>
    `,
  }
}

export function inviteEmail(opts: {
  recipientName: string
  inviterName?: string
  setupUrl: string
}) {
  return {
    subject: 'Welcome to TeamTracker — set your password',
    html: `
      <div style="${baseStyle}">
        <h2 style="margin-top:0;">Welcome to TeamTracker</h2>
        <p>Hi ${opts.recipientName},</p>
        <p>${opts.inviterName ?? 'An admin'} has created an account for you. Click the button below to set your password and sign in.</p>
        <p style="margin: 24px 0;">
          <a href="${opts.setupUrl}" style="display:inline-block; padding:12px 24px; background:#2563eb; color:white; text-decoration:none; border-radius:8px; font-weight:500;">Set your password</a>
        </p>
        <p style="color:#6b7280; font-size:13px;">Or copy this link into your browser:<br/><span style="color:#2563eb;">${opts.setupUrl}</span></p>
        <p style="color:#9ca3af; font-size:12px; margin-top:24px;">This link expires in 7 days. If you didn't expect this email, you can ignore it.</p>
        <p style="color:#9ca3af; font-size:12px; margin-top:32px;">— TeamTracker</p>
      </div>
    `,
  }
}

export function workflowReviewedEmail(opts: {
  recipientName: string
  reviewerName: string
  employeeName: string
  workflowType: 'Promotion' | 'Salary Hike'
  decision: 'APPROVED' | 'REJECTED'
  detail: string
  reviewNote?: string | null
  appUrl?: string
}) {
  const decisionColor = opts.decision === 'APPROVED' ? '#059669' : '#dc2626'
  const decisionLabel = opts.decision === 'APPROVED' ? 'Approved ✓' : 'Rejected ✗'

  return {
    subject: `Your ${opts.workflowType.toLowerCase()} request for ${opts.employeeName} was ${opts.decision.toLowerCase()}`,
    html: `
      <div style="${baseStyle}">
        <h2 style="margin-top:0;">Your ${opts.workflowType} Request was Reviewed</h2>
        <p>Hi ${opts.recipientName},</p>
        <p><strong>${opts.reviewerName}</strong> has reviewed your ${opts.workflowType.toLowerCase()} recommendation for <strong>${opts.employeeName}</strong>.</p>
        <div style="background:#f3f4f6; padding:16px; border-radius:8px; margin:16px 0;">
          <p style="margin:0;">${opts.detail}</p>
          <p style="margin:12px 0 0; font-weight:600; color:${decisionColor};">${decisionLabel}</p>
          ${opts.reviewNote ? `<p style="margin:8px 0 0; color:#4b5563;"><em>Note: ${opts.reviewNote}</em></p>` : ''}
        </div>
        ${opts.appUrl ? `<a href="${opts.appUrl}/dashboard/workflows" style="display:inline-block; padding:10px 20px; background:#2563eb; color:white; text-decoration:none; border-radius:8px; font-weight:500;">View in TeamTracker →</a>` : ''}
        <p style="color:#9ca3af; font-size:12px; margin-top:32px;">— TeamTracker</p>
      </div>
    `,
  }
}
