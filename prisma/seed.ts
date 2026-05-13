import { PrismaClient, Role } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12)
  const managerPassword = await bcrypt.hash('manager123', 12)
  const leadPassword = await bcrypt.hash('lead123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@teamtracker.dev' },
    update: {},
    create: { name: 'Admin User', email: 'admin@teamtracker.dev', password: adminPassword, role: Role.ADMIN },
  })

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
  console.log('  Admin: admin@teamtracker.dev / admin123')
  console.log('  Manager: manager@teamtracker.dev / manager123')
  console.log('  Team Lead: lead1@teamtracker.dev / lead123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
