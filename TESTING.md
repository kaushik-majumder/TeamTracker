# Testing

TeamTracker uses **Vitest** for unit and integration tests. Tests run automatically
on every commit (via Husky), every pull request (via GitHub Actions), and can be
run locally on demand.

## Quick start

```bash
npm test                # one-shot run
npm run test:watch      # watch mode, re-runs on save
npm run test:coverage   # generates HTML coverage in coverage/index.html
```

All four checks at once (what CI runs):

```bash
npm run ci   # lint + typecheck + test + build
```

## What's tested

### Pure logic (`tests/lib/`)

| File | What it covers |
|---|---|
| `hierarchy-pure.test.ts` | `levelOf`, `approverRoleFor`, `canRecommendRoles` — role-ordering and workflow-routing logic |
| `email-validation.test.ts` | `validateEmailDomain` — placeholder blocklist + MX lookup with mocked DNS |
| `email-template.test.ts` | HTML template builders for workflow / invite emails |
| `email-send.test.ts` | The `sendEmail` wrapper's graceful-failure behavior when SMTP isn't configured |
| `session.test.ts` | JWT encrypt/decrypt round-trip and signature verification |
| `audit.test.ts` | `audit()` helper — write shape and error swallowing |

These all use mocked DB / network so they run fast (<2 s end-to-end).

### What's **not** tested (yet)

- **Server actions that hit the DB**: `createUser`, `submitCycleReview`, etc.
  These would need a real test database. A future iteration could add a docker-compose
  Postgres + a test-only `DATABASE_URL` and run actions against it.
- **End-to-end browser flows**: would need Playwright. Out of scope for now.

## Adding tests for a new feature

When you ship a feature, add tests in the matching directory:

```
tests/
├── setup.ts              ← global env + module mocks; rarely touched
├── lib/                  ← unit tests for lib/* helpers
│   └── *.test.ts
└── actions/              ← integration tests for actions/* (when added)
    └── *.test.ts
```

A few conventions to keep tests fast and reliable:

1. **Mock external boundaries** — DB (`@/lib/db`), DNS (`dns`), SMTP (`nodemailer`),
   network calls. Never hit a real network during unit tests.
2. **Use `vi.hoisted()` for mock state shared between `vi.mock()` and `beforeEach`** —
   `vi.mock` hoists itself above imports, so top-level `const x = vi.fn()` references
   inside the factory will be undefined unless hoisted.
3. **Test the contract, not the implementation** — assert what callers care about
   (return value, side effects), not how the function gets there.
4. **One file per source module** — `lib/foo.ts` → `tests/lib/foo.test.ts`.

## Pre-commit hook

`.husky/pre-commit` runs before every commit:

```
npx lint-staged   # ESLint --fix on changed files
npm run typecheck # tsc --noEmit
npm run test      # vitest run
```

If any of these fail, the commit is blocked. To bypass in an emergency:
`git commit --no-verify` (but please don't — fix the test first).

## CI pipeline

`.github/workflows/ci.yml` runs on every push to `main` and every pull request:

1. Checkout
2. Install deps (`npm ci`)
3. `npx prisma generate`
4. `npm run lint`
5. `npm run typecheck`
6. `npm run test`
7. `npm run build`

The CI job has dummy env vars set (DATABASE_URL pointing to a fake host) — the
tests never actually connect because they mock the DB.

## Updating tests when a feature changes

Whenever you touch a file under `lib/` or `actions/` that has a test:

1. Run `npm run test:watch` while you make the change
2. If a test breaks, decide whether:
   - The test was wrong (update the test)
   - The new behavior is wrong (revert the change)
3. Add new tests for any new logic branch or edge case you introduced

The pre-commit hook will catch you if you forget — but it's easier to fix during
development than after.
