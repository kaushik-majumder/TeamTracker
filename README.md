# TeamTracker

HR tooling for team leads, managers, MDs, and admins. Tracks team members,
performance, anniversaries, promotion/salary workflows, structured review
cycles, and an audit log.

## Stack

- **Next.js 16** (App Router, Turbopack, Server Actions)
- **TypeScript** strict mode
- **Prisma 7** + **PostgreSQL** (Supabase) using the `@prisma/adapter-pg` driver
- **Jose** for stateless JWT sessions
- **Tailwind v4** for styling
- **Nodemailer** (Gmail SMTP in production) for transactional email
- **Vitest** for tests, **Husky** + **lint-staged** for pre-commit checks
- **GitHub Actions** for CI; **AWS Amplify Hosting** for production deploys

## Local setup

```bash
git clone https://github.com/kaushik-majumder/TeamTracker
cd TeamTracker
npm install
cp .env.example .env       # fill in DATABASE_URL etc.
npm run db:migrate         # apply migrations
npm run db:seed            # demo admin + manager + lead + employees
npm run dev                # http://localhost:3000
```

Seed accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@teamtracker.dev` | `admin123` |
| Manager | `manager@teamtracker.dev` | `manager123` |
| Team Lead | `lead1@teamtracker.dev` | `lead123` |

## Features

- **Multi-role hierarchy** — Admin → Managing Director → Manager → Team Lead → Team Member
- **Tiered approval workflows** — promotion / salary hike requests routed up the chain
- **Performance** — ad-hoc notes (with file attachments) + structured review cycles
- **Anniversary emails** — daily cron CCs leadership on each member's anniversary
- **In-app + email notifications** — workflow events and review assignments
- **Profile** — name, email, gender, profile image upload (resized client-side)
- **Audit log** — every state-changing action recorded, browsable by admin

## Scripts

```bash
npm run dev              # local dev server
npm run build            # production build
npm run lint             # ESLint
npm run typecheck        # TypeScript --noEmit
npm test                 # vitest run
npm run test:watch       # vitest watch mode
npm run test:coverage    # generate coverage report
npm run ci               # lint + typecheck + test + build (what CI runs)
npm run db:migrate       # prisma migrate dev
npm run db:seed          # seed demo data
npm run db:studio        # open Prisma Studio
```

## Testing

See [TESTING.md](./TESTING.md) for the full story. TL;DR:

- Pre-commit hook runs lint + typecheck + tests on every `git commit`
- GitHub Actions runs the same checks on every push and pull request
- Add tests under `tests/` when you ship a feature — keep coverage growing

## Deployment

The production deploy lives on AWS Amplify Hosting at
`https://main.d59283vhkodf6.amplifyapp.com`.

GitHub Actions also runs a **daily anniversary cron** at 09:00 EST that hits
`/api/cron/anniversaries` — see `.github/workflows/anniversaries.yml`.

## Environment variables

```env
DATABASE_URL=postgresql://...:6543/postgres?pgbouncer=true   # pooler, runtime
DIRECT_URL=postgresql://...:5432/postgres                    # direct, migrations
SESSION_SECRET=...     # openssl rand -base64 32
CRON_SECRET=...        # openssl rand -hex 24
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=...          # Gmail App Password (16 chars)
EMAIL_FROM=Team eXp Realty <you@gmail.com>
APP_URL=https://your-deployment.example.com
```

The graceful-SMTP fallback means missing email config won't break the app —
it just logs `[email] SMTP not configured` instead of sending.
