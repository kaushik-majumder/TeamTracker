import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const managerPassword = await bcrypt.hash('manager123', 12)
  const leadPassword = await bcrypt.hash('lead123', 12)

  const manager = await prisma.user.upsert({
    where: { email: 'manager@teamtracker.dev' },
    update: {},
    create: { name: 'Alex Manager', email: 'manager@teamtracker.dev', password: managerPassword, role: Role.MANAGER },
  })

  const lead1 = await prisma.user.upsert({
    where: { email: 'lead1@teamtracker.dev' },
    update: {},
    create: { name: 'Sam Lead', email: 'lead1@teamtracker.dev', password: leadPassword, role: Role.TEAM_LEAD },
  })

  const team = await prisma.team.upsert({
    where: { id: 'seed-team-1' },
    update: {},
    create: {
      id: 'seed-team-1',
      name: 'Platform Engineering',
      description: 'Owns core infrastructure and developer tooling.',
      teamAccess: {
        create: [
          { userId: manager.id, role: Role.MANAGER },
          { userId: lead1.id, role: Role.TEAM_LEAD },
        ],
      },
    },
  })

  await prisma.employee.upsert({
    where: { id: 'seed-emp-1' },
    update: {},
    create: {
      id: 'seed-emp-1',
      name: 'Jordan Chen',
      email: 'jordan@company.com',
      title: 'Software Engineer',
      joinDate: new Date('2022-05-13'),
      teamId: team.id,
    },
  })

  await prisma.employee.upsert({
    where: { id: 'seed-emp-2' },
    update: {},
    create: {
      id: 'seed-emp-2',
      name: 'Riley Park',
      email: 'riley@company.com',
      title: 'Senior Engineer',
      joinDate: new Date('2021-03-01'),
      teamId: team.id,
    },
  })

  console.log('Seed complete.')
  console.log('  Manager: manager@teamtracker.dev / manager123')
  console.log('  Team Lead: lead1@teamtracker.dev / lead123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
