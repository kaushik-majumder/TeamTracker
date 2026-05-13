import { prisma } from '@/lib/db'
import { CreateUserForm } from './CreateUserForm'
import { DeleteUserButton } from './DeleteUserButton'
import { format } from 'date-fns'

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: { teamAccess: { include: { team: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">User Management</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {users.map((u) => (
            <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{u.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                    u.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {u.role}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{u.email}</p>
                {u.teamAccess.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Teams: {u.teamAccess.map((a) => a.team.name).join(', ')}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">Joined {format(u.createdAt, 'MMM d, yyyy')}</p>
              </div>
              {u.role !== 'ADMIN' && <DeleteUserButton userId={u.id} name={u.name} />}
            </div>
          ))}
        </div>

        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Create User</h2>
            <CreateUserForm />
          </div>
        </div>
      </div>
    </div>
  )
}
