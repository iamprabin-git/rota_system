import { neon } from "@neondatabase/serverless";

export function databaseUrl() {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED ||
    ""
  );
}

export function isPostgresConfigured() {
  return Boolean(databaseUrl());
}

let client: ReturnType<typeof neon> | null = null;
let boot: Promise<void> | null = null;

function sql() {
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL is not set.");
  if (!client) {
    client = neon(url, { fetchOptions: { cache: "no-store" } });
  }
  return client;
}

export async function query<T extends Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const rows = await sql().query(text, params);
  return rows as T[];
}

export async function execute(text: string, params: unknown[] = []) {
  await query(text, params);
}

const TABLES = [
  `CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    trading_name TEXT NOT NULL DEFAULT '',
    address_line1 TEXT NOT NULL DEFAULT '',
    address_line2 TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    postcode TEXT NOT NULL DEFAULT '',
    paye_reference TEXT NOT NULL DEFAULT '',
    accounts_office_ref TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    job_title TEXT NOT NULL DEFAULT '',
    department TEXT NOT NULL DEFAULT '',
    payroll_number TEXT NOT NULL DEFAULT '',
    ni_number TEXT NOT NULL DEFAULT '',
    tax_code TEXT NOT NULL DEFAULT '',
    tax_region TEXT NOT NULL DEFAULT 'england',
    ni_category TEXT NOT NULL DEFAULT 'A',
    hourly_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
    overtime_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    start_date TEXT NOT NULL DEFAULT '',
    date_of_birth TEXT NOT NULL DEFAULT '',
    student_loan TEXT NOT NULL DEFAULT 'none',
    postgraduate_loan BOOLEAN NOT NULL DEFAULT FALSE,
    pension_employee_percent DOUBLE PRECISION NOT NULL DEFAULT 5,
    pension_employer_percent DOUBLE PRECISION NOT NULL DEFAULT 3,
    pension_basis TEXT NOT NULL DEFAULT 'qualifying',
    payment_method TEXT NOT NULL DEFAULT 'bacs',
    bank_sort_code TEXT NOT NULL DEFAULT '',
    bank_account_last4 TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS employees_company_idx ON employees(company_id)`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    company_id TEXT,
    employee_id TEXT,
    created_at TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    job_title TEXT NOT NULL DEFAULT '',
    notify_email BOOLEAN NOT NULL DEFAULT TRUE
  )`,
  `CREATE INDEX IF NOT EXISTS users_company_idx ON users(company_id)`,
  `CREATE INDEX IF NOT EXISTS users_employee_idx ON users(employee_id)`,
  `CREATE TABLE IF NOT EXISTS rota (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    week_start TEXT NOT NULL,
    days JSONB NOT NULL,
    overtime_hours DOUBLE PRECISION NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    UNIQUE (employee_id, week_start)
  )`,
  `CREATE TABLE IF NOT EXISTS payslips (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    payment_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    data JSONB NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS payslips_employee_idx ON payslips(employee_id)`,
  `CREATE TABLE IF NOT EXISTS hour_logs (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    date TEXT NOT NULL,
    hours DOUBLE PRECISION NOT NULL DEFAULT 0,
    overtime_hours DOUBLE PRECISION NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS hour_logs_employee_idx ON hour_logs(employee_id)`,
  `CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    payslip_id TEXT,
    amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    due_date TEXT NOT NULL,
    paid_date TEXT NOT NULL DEFAULT '',
    method TEXT NOT NULL DEFAULT '',
    reference TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS payments_employee_idx ON payments(employee_id)`,
  `CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'other',
    notes TEXT NOT NULL DEFAULT '',
    uploaded_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS files_employee_idx ON files(employee_id)`,
];

export async function ensurePostgres() {
  if (!isPostgresConfigured()) return;
  if (!boot) {
    boot = (async () => {
      for (const statement of TABLES) await execute(statement);
    })().catch((error) => {
      boot = null;
      throw error;
    });
  }
  await boot;
}
