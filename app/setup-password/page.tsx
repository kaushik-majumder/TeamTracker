import { prisma } from '@/lib/db'
import { SetupPasswordForm } from './SetupPasswordForm'

export default async function SetupPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  let invalidReason: string | null = null
  let userName: string | null = null

  if (!token) {
    invalidReason = 'No invite token provided.'
  } else {
    const user = await prisma.user.findUnique({
      where: { passwordSetupToken: token },
      select: { name: true, passwordSetupExpiresAt: true },
    })
    if (!user) invalidReason = 'This invite link is invalid.'
    else if (!user.passwordSetupExpiresAt || user.passwordSetupExpiresAt < new Date()) {
      invalidReason = 'This invite link has expired.'
    } else {
      userName = user.name
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">TeamTracker</h1>
            <p className="text-sm text-gray-500 mt-1">
              {invalidReason ? 'Invite link issue' : `Welcome${userName ? `, ${userName.split(' ')[0]}` : ''} — set your password to get started`}
            </p>
          </div>

          {invalidReason ? (
            <div className="space-y-3">
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{invalidReason}</p>
              <p className="text-sm text-gray-500">Ask your admin to send a new invite email.</p>
            </div>
          ) : (
            <SetupPasswordForm token={token!} />
          )}
        </div>
      </div>
    </div>
  )
}
