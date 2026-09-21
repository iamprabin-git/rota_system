# RotaSystem

Full-stack Next.js app with **three login panels**: platform admin, company agent (payroll), and company user (personal hours and pay).

## Sign in

Open [http://localhost:3000](http://localhost:3000) and use:

| Panel | Role | Email | Password |
| --- | --- | --- | --- |
| Admin | Manages companies | admin@rotasystem.local | RotaAdmin26 |
| Agent | Payroll for RotaSystem Care | agent@rotasystem.local | Agent2026 |
| User | Staff at RotaSystem Care | amira@rotasystem.local | Hours2026 |
| Agent | Payroll for Harbourview Care | priya@harbourview.local | Agent2026 |
| User | Staff at Harbourview Care | niamh@harbourview.local | Hours2026 |

James and Fraser also sign in as users with password `Hours2026`.

## Roles

- **Admin** (`/admin`) creates and edits companies and their agent logins. Admin does not run payroll.
- **Agent** (`/agent`) belongs to one company and runs that company's rota, people, and UK PAYE payslips.
- **User** (`/me`) belongs to the same company as their staff record and can log hours, view statements, track pay, and keep files.

## Run it

```bash
npm install
npm run dev
```

## Data store

All companies, people, logins, hours, rota, payslips and payments go in **Neon Postgres** (the same engine as Vercel’s Neon Marketplace database). Uploaded files and profile photos go in **Vercel Blob** when `BLOB_READ_WRITE_TOKEN` is set.

Create or refresh a local database URL:

```bash
npx neon claim create --env-pull --file .env.local
npm run db:setup
```

On Vercel, add the **Neon** Marketplace integration (or paste `DATABASE_URL` / `POSTGRES_URL` into project env vars). Then:

```bash
npx vercel env pull .env.local
```

The first request against an empty Postgres database copies the demo records in automatically. The admin dashboard shows **Neon Postgres** when that URL is set.

Without `DATABASE_URL` / `POSTGRES_URL`, local development still uses `data/db.json`.
