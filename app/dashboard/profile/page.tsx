import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProfileForm } from './ProfileForm'

export default async function ProfilePage() {
  const session = await requireAuth()
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      email: true,
      gender: true,
      profileImageUrl: true,
      role: true,
    },
  })

  if (!user) return null

  const roleLabel = {
    ADMIN: 'Admin',
    MANAGING_DIRECTOR: 'Managing Director',
    MANAGER: 'Manager',
    TEAM_LEAD: 'Team Lead',
  }[user.role]

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Your Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Signed in as {roleLabel}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ProfileForm
          defaultName={user.name}
          defaultEmail={user.email}
          defaultGender={user.gender}
          defaultProfileImageUrl={user.profileImageUrl}
        />
      </div>
    </div>
  )
}
