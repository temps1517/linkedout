# LinkedOut

LinkedOut is a role-based professional networking and training platform for students, trainers, corporate partners, and administrators. The MVP includes profiles and portfolios, connections and messaging, a community feed with images/video, training cohorts with assignments and certificates, company profiles and opportunities, notifications, and admin moderation.

## Quick start

Requirements: Node.js 22+ and npm.

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

Open http://localhost:3000.

`npm run db:setup` runs `prisma generate`, `prisma db push`, and the seed script. The local database is SQLite at `prisma/dev.db`; uploaded files are written to `.data/uploads`. Both are ignored by Git.

## Demo accounts

All demo accounts use password `Password123!`.

| Role | Email |
| --- | --- |
| Student | `student@linkedout.local` |
| Trainer | `trainer@linkedout.local` |
| Company | `company@linkedout.local` |
| Admin | `admin@linkedout.local` |
| Student 2 | `student2@linkedout.local` |

Seeded data includes profiles, skills, accepted and pending connections, messages, posts, a training programme with a cohort and graded submission, a company, an opportunity, an application, and notifications.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Generate Prisma Client and build for production. |
| `npm start` | Start the production server after a build. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript with no emit. |
| `npm test -- --run` | Run Vitest once. |
| `npm run db:generate` | Regenerate Prisma Client. |
| `npm run db:push` | Sync the schema to the local database. |
| `npm run db:seed` | Reseed demo data. |
| `npm run db:setup` | Generate, sync, and seed in one step. |

## Feature map

- `/dashboard` — role-aware overview.
- `/profile/me` — edit profile, skills, experience, qualifications, projects, achievements, portfolio, avatar, and CV.
- `/profile/[id]`, `/people` — public profiles, search, endorsements, connection requests.
- `/messages` — private conversation threads with read state.
- `/feed` — rich posts, image/video uploads, reactions, comments, bookmarks, reports, admin hiding.
- `/training`, `/training/[id]` — programmes, cohorts, enrolment, sessions, progress, submissions, grades, certificates.
- `/trainer` — programme builder, publishing, cohorts, modules, assignments, grading queue.
- `/companies`, `/companies/[id]` — company profiles, verification, team, opportunities, applications.
- `/opportunities` — searchable jobs, internships, projects, and mentorships.
- `/notifications` — in-app notification centre.
- `/admin` — reports, role management, company verification, email verification, audit log.

## Architecture

- Next.js App Router with React Server Components and Server Actions.
- TypeScript, Tailwind CSS 4, Prisma 6, SQLite for local development.
- Cookie-based sessions stored hashed in the database; passwords hashed with bcrypt.
- RBAC helpers in `src/lib/rbac.ts`; route-level role checks use `requireRole`.
- Zod validation schemas are shared by forms and server actions.
- Email delivery uses SMTP when configured; otherwise messages are logged to the server console while in-app notifications are always persisted.
- Local uploads are validated by MIME type and size, stored in `.data/uploads`, and served through `/api/files/[id]` with access checks.

## Environment

Copy `.env.example` to `.env` before running the app.

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Local default is `file:./dev.db`. Switch to a managed Postgres URL for deployment. |
| `SESSION_SECRET` | Replace with a strong random value outside development. |
| `APP_URL` | Used to build absolute email links. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Configure for real email delivery. |

## Production handover

The local MVP uses SQLite and filesystem uploads for a fast self-contained setup. Before public deployment:

1. Move `DATABASE_URL` to managed Postgres, update the Prisma provider to `postgresql`, run `prisma migrate dev` once, and deploy with `prisma migrate deploy`.
2. Replace local filesystem upload storage with object storage such as S3-compatible storage; keep `/api/files/[id]` as an authorised proxy or use signed URLs.
3. Configure SMTP, `APP_URL`, and a strong `SESSION_SECRET`.
4. Enforce verification before allowing company opportunity posting if required by your moderation policy.
5. Add rate limiting and abuse controls on authentication, uploads, messaging, and reporting endpoints.
6. Review `npm audit`; the current dependency tree reports 4 high severity advisories that should be triaged before production.

## Verification performed

`npm run lint`, `npm run typecheck`, `npm test -- --run`, and `npm run build` all pass. The production server was smoke-tested for public pages, protected redirects, all four demo roles, restricted trainer/admin areas, and seeded detail pages.
