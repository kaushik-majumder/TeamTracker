/**
 * Tests for the sendEmail wrapper in lib/email.ts.
 * Verifies that the function fails gracefully (returns a status object rather
 * than throwing) when SMTP is not configured or send fails.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const sendMailMock = vi.fn()

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: sendMailMock })),
  },
}))

beforeEach(() => {
  sendMailMock.mockReset()
  // Reset module-level transporter cache so each test starts fresh
  vi.resetModules()
  // Clear any pre-existing env vars
  delete process.env.SMTP_HOST
  delete process.env.SMTP_USER
  delete process.env.SMTP_PASS
})

describe('sendEmail', () => {
  it('returns { sent: false, reason: "smtp-not-configured" } when SMTP env is missing', async () => {
    const { sendEmail } = await import('@/lib/email')
    const result = await sendEmail({ to: 'a@b.com', subject: 's', html: '<p>x</p>' })
    expect(result.sent).toBe(false)
    if (!result.sent) expect(result.reason).toBe('smtp-not-configured')
  })

  it('treats placeholder values as not configured', async () => {
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_USER = 'your-email@example.com'
    process.env.SMTP_PASS = 'your-email-password'

    const { sendEmail } = await import('@/lib/email')
    const result = await sendEmail({ to: 'a@b.com', subject: 's', html: '<p>x</p>' })
    expect(result.sent).toBe(false)
  })

  it('sends successfully with real-looking SMTP creds', async () => {
    process.env.SMTP_HOST = 'smtp.gmail.com'
    process.env.SMTP_USER = 'real@gmail.com'
    process.env.SMTP_PASS = 'real-password'
    sendMailMock.mockResolvedValue({ messageId: 'ok' })

    const { sendEmail } = await import('@/lib/email')
    const result = await sendEmail({ to: 'a@b.com', subject: 's', html: '<p>x</p>' })
    expect(result.sent).toBe(true)
    expect(sendMailMock).toHaveBeenCalledOnce()
  })

  it('returns { sent: false, reason: "send-failed" } when SMTP throws', async () => {
    process.env.SMTP_HOST = 'smtp.gmail.com'
    process.env.SMTP_USER = 'real@gmail.com'
    process.env.SMTP_PASS = 'real-password'
    sendMailMock.mockRejectedValue(new Error('connection refused'))

    const { sendEmail } = await import('@/lib/email')
    const result = await sendEmail({ to: 'a@b.com', subject: 's', html: '<p>x</p>' })
    expect(result.sent).toBe(false)
    if (!result.sent) expect(result.reason).toBe('send-failed')
  })

  it('forwards cc[] and bcc[] when provided', async () => {
    process.env.SMTP_HOST = 'smtp.gmail.com'
    process.env.SMTP_USER = 'real@gmail.com'
    process.env.SMTP_PASS = 'real-password'
    sendMailMock.mockResolvedValue({})

    const { sendEmail } = await import('@/lib/email')
    await sendEmail({
      to: 'a@b.com',
      subject: 's',
      html: '<p>x</p>',
      cc: ['c1@x.com', 'c2@x.com'],
      bcc: ['bcc@x.com'],
    })

    const call = sendMailMock.mock.calls[0][0]
    expect(call.cc).toEqual(['c1@x.com', 'c2@x.com'])
    expect(call.bcc).toEqual(['bcc@x.com'])
  })

  it('omits cc/bcc fields when arrays are empty', async () => {
    process.env.SMTP_HOST = 'smtp.gmail.com'
    process.env.SMTP_USER = 'real@gmail.com'
    process.env.SMTP_PASS = 'real-password'
    sendMailMock.mockResolvedValue({})

    const { sendEmail } = await import('@/lib/email')
    await sendEmail({ to: 'a@b.com', subject: 's', html: '<p>x</p>', cc: [] })

    const call = sendMailMock.mock.calls[0][0]
    expect(call.cc).toBeUndefined()
  })
})
