import 'server-only'
import { prisma } from './db'
import { sendEmail } from './email'
import { NotificationType } from '@prisma/client'

type NotifyOpts = {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  email?: {
    to: string
    subject: string
    html: string
  }
}

export async function notify(opts: NotifyOpts) {
  await prisma.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      message: opts.message,
      link: opts.link,
    },
  })

  if (opts.email) {
    // Fire-and-forget — don't block the request on slow SMTP
    await sendEmail(opts.email)
  }
}

/** Notify many users — useful when a team has multiple managers. */
export async function notifyAll(
  recipients: { userId: string; email: string }[],
  shared: Omit<NotifyOpts, 'userId' | 'email'> & {
    emailFor: (recipient: { userId: string; email: string }) => { subject: string; html: string }
  }
) {
  await Promise.all(
    recipients.map((r) =>
      notify({
        userId: r.userId,
        type: shared.type,
        title: shared.title,
        message: shared.message,
        link: shared.link,
        email: { to: r.email, ...shared.emailFor(r) },
      })
    )
  )
}
