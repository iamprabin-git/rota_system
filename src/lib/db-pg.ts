import { withCompanyDefaults } from "./company";
import { hashPassword } from "./passwords";
import { getDb } from "./db-file";
import { startOfWeek } from "./format";
import { ensurePostgres, execute, query } from "./sql";
import { removeObject } from "./storage";
import { accountStatus, approvalStatus, withHourApproval, withPayslipApproval } from "./approvals";
import type {
  Company,
  CompanyFollowUp,
  CompanyPayment,
  Employee,
  HourLog,
  Payment,
  Payslip,
  RecordFile,
  RotaEntry,
  User,
  Weekday,
} from "./types";
import { WEEKDAYS } from "./types";
import { emptyDays } from "./uk-payroll";

function json<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function num(value: unknown) {
  return Number(value) || 0;
}

function mapCompany(row: Record<string, unknown>): Company {
  return {
    id: String(row.id),
    name: String(row.name || ""),
    tradingName: String(row.trading_name || ""),
    addressLine1: String(row.address_line1 || ""),
    addressLine2: String(row.address_line2 || ""),
    city: String(row.city || ""),
    postcode: String(row.postcode || ""),
    payeReference: String(row.paye_reference || ""),
    accountsOfficeRef: String(row.accounts_office_ref || ""),
    email: String(row.email || ""),
    phone: String(row.phone || ""),
    logo: String(row.logo || ""),
    access: row.access === "disallowed" ? "disallowed" : "allowed",
    live: row.live === "deactive" ? "deactive" : "active",
    crmStage:
      row.crm_stage === "lead" || row.crm_stage === "onboarding" || row.crm_stage === "at-risk" || row.crm_stage === "closed"
        ? row.crm_stage
        : "active",
    crmNotes: String(row.crm_notes || ""),
    nextFollowUp: String(row.next_follow_up || ""),
    lastContactedAt: String(row.last_contacted_at || ""),
  };
}

function mapEmployee(row: Record<string, unknown>): Employee {
  return {
    id: String(row.id),
    firstName: String(row.first_name || ""),
    lastName: String(row.last_name || ""),
    jobTitle: String(row.job_title || ""),
    department: String(row.department || ""),
    payrollNumber: String(row.payroll_number || ""),
    niNumber: String(row.ni_number || ""),
    taxCode: String(row.tax_code || ""),
    taxRegion: (row.tax_region as Employee["taxRegion"]) || "england",
    niCategory: (row.ni_category as Employee["niCategory"]) || "A",
    hourlyRate: num(row.hourly_rate),
    overtimeMultiplier: num(row.overtime_multiplier) || 1.5,
    startDate: String(row.start_date || ""),
    dateOfBirth: String(row.date_of_birth || ""),
    studentLoan: (row.student_loan as Employee["studentLoan"]) || "none",
    postgraduateLoan: Boolean(row.postgraduate_loan),
    pensionEmployeePercent: num(row.pension_employee_percent),
    pensionEmployerPercent: num(row.pension_employer_percent),
    pensionBasis: (row.pension_basis as Employee["pensionBasis"]) || "qualifying",
    paymentMethod: (row.payment_method as Employee["paymentMethod"]) || "bacs",
    bankSortCode: String(row.bank_sort_code || ""),
    bankAccountLast4: String(row.bank_account_last4 || ""),
    email: String(row.email || ""),
    companyId: String(row.company_id),
    createdAt: String(row.created_at),
  };
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    name: String(row.name),
    role: row.role as User["role"],
    companyId: row.company_id == null ? null : String(row.company_id),
    employeeId: row.employee_id == null ? null : String(row.employee_id),
    createdAt: String(row.created_at),
    avatar: String(row.avatar || ""),
    phone: String(row.phone || ""),
    jobTitle: String(row.job_title || ""),
    notifyEmail: row.notify_email !== false,
    status: accountStatus({ status: row.status as User["status"] }),
  };
}

function mapRota(row: Record<string, unknown>): RotaEntry {
  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    weekStart: String(row.week_start),
    days: { ...emptyDays(), ...json<RotaEntry["days"]>(row.days, emptyDays()) },
    overtimeHours: num(row.overtime_hours),
    notes: String(row.notes || ""),
  };
}

function mapHour(row: Record<string, unknown>): HourLog {
  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    date: String(row.date),
    startTime: String(row.start_time || ""),
    endTime: String(row.end_time || ""),
    hours: num(row.hours),
    overtimeHours: num(row.overtime_hours),
    notes: String(row.notes || ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    status: approvalStatus(row.status as HourLog["status"]),
    reviewNote: String(row.review_note || ""),
    reviewedAt: String(row.reviewed_at || ""),
    reviewedBy: String(row.reviewed_by || ""),
  };
}

function mapPayment(row: Record<string, unknown>): Payment {
  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    payslipId: row.payslip_id == null ? null : String(row.payslip_id),
    amount: num(row.amount),
    status: row.status as Payment["status"],
    dueDate: String(row.due_date),
    paidDate: String(row.paid_date || ""),
    method: (row.method as Payment["method"]) || "",
    reference: String(row.reference || ""),
    notes: String(row.notes || ""),
    createdAt: String(row.created_at),
  };
}

function mapCompanyPayment(row: Record<string, unknown>): CompanyPayment {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    amount: num(row.amount),
    status: row.status === "received" ? "received" : "due",
    dueDate: String(row.due_date),
    paidDate: String(row.paid_date || ""),
    method: (row.method as CompanyPayment["method"]) || "",
    reference: String(row.reference || ""),
    notes: String(row.notes || ""),
    createdAt: String(row.created_at),
  };
}

function mapCompanyFollowUp(row: Record<string, unknown>): CompanyFollowUp {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    note: String(row.note || ""),
    dueDate: String(row.due_date || ""),
    completedAt: String(row.completed_at || ""),
    createdAt: String(row.created_at),
  };
}

function mapFile(row: Record<string, unknown>): RecordFile {
  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    originalName: String(row.original_name),
    storedName: String(row.stored_name),
    mimeType: String(row.mime_type),
    size: num(row.size),
    category: (row.category as RecordFile["category"]) || "other",
    notes: String(row.notes || ""),
    uploadedAt: String(row.uploaded_at),
  };
}

function weekdayFromIso(iso: string): Weekday {
  const date = new Date(`${iso}T12:00:00`);
  const day = date.getDay();
  return day === 0 ? "sun" : WEEKDAYS[day - 1];
}

async function companyEmployeeIds(companyId?: string) {
  if (!companyId) return null;
  const rows = await query<{ id: string }>("SELECT id FROM employees WHERE company_id = $1", [companyId]);
  return new Set(rows.map((row) => row.id));
}

async function ensureDemoAccounts() {
  const snapshot = getDb();
  for (const user of snapshot.users) {
    const rows = await query<{ id: string }>("SELECT id FROM users WHERE lower(email) = lower($1)", [user.email]);
    if (rows[0]) continue;
    await upsertUser(user);
  }
}

async function seedIfEmpty() {
  const count = await query<{ n: string }>("SELECT COUNT(*)::text AS n FROM companies");
  if (Number(count[0]?.n || 0) > 0) return;
  const snapshot = getDb();
  for (const company of snapshot.companies) await upsertCompany(company);
  for (const employee of snapshot.employees) await upsertEmployee(employee, false);
  for (const user of snapshot.users) await upsertUser(user);
  for (const entry of snapshot.rota) await upsertRotaEntry(entry);
  for (const slip of snapshot.payslips) {
    await execute(
      `INSERT INTO payslips (id, employee_id, payment_date, created_at, data) VALUES ($1,$2,$3,$4,$5::jsonb)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
      [slip.id, slip.employeeId, slip.paymentDate, slip.createdAt, JSON.stringify(slip)],
    );
  }
  for (const log of snapshot.hourLogs) await upsertHourLog(log, false);
  for (const payment of snapshot.payments) await upsertPayment(payment);
  for (const payment of snapshot.companyPayments) await upsertCompanyPayment(payment);
  for (const item of snapshot.companyFollowUps) await upsertCompanyFollowUp(item);
  for (const file of snapshot.files) await addFileRecord(file);
}

let readyPromise: Promise<void> | null = null;
let seeding = false;

export async function ready() {
  await ensurePostgres();
  if (seeding) return;
  if (!readyPromise) {
    readyPromise = (async () => {
      seeding = true;
      try {
        await seedIfEmpty();
        await ensureDemoAccounts();
      } finally {
        seeding = false;
      }
    })().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }
  await readyPromise;
}

export async function listCompanies() {
  await ready();
  const rows = await query("SELECT * FROM companies ORDER BY name");
  return rows.map(mapCompany);
}

export async function getCompany(id?: string | null) {
  if (!id) return undefined;
  await ready();
  const rows = await query("SELECT * FROM companies WHERE id = $1", [id]);
  return rows[0] ? mapCompany(rows[0]) : undefined;
}

export async function upsertCompany(company: Company) {
  await ready();
  const next = withCompanyDefaults({ ...company, id: company.id || `co_${crypto.randomUUID()}` });
  await execute(
    `INSERT INTO companies (id, name, trading_name, address_line1, address_line2, city, postcode, paye_reference, accounts_office_ref, email, phone, logo, access, live, crm_stage, crm_notes, next_follow_up, last_contacted_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, trading_name = EXCLUDED.trading_name, address_line1 = EXCLUDED.address_line1,
       address_line2 = EXCLUDED.address_line2, city = EXCLUDED.city, postcode = EXCLUDED.postcode,
       paye_reference = EXCLUDED.paye_reference, accounts_office_ref = EXCLUDED.accounts_office_ref,
       email = EXCLUDED.email, phone = EXCLUDED.phone, logo = EXCLUDED.logo, access = EXCLUDED.access,
       live = EXCLUDED.live, crm_stage = EXCLUDED.crm_stage, crm_notes = EXCLUDED.crm_notes,
       next_follow_up = EXCLUDED.next_follow_up, last_contacted_at = EXCLUDED.last_contacted_at`,
    [
      next.id,
      next.name,
      next.tradingName,
      next.addressLine1,
      next.addressLine2,
      next.city,
      next.postcode,
      next.payeReference,
      next.accountsOfficeRef,
      next.email,
      next.phone,
      next.logo || "",
      next.access,
      next.live,
      next.crmStage,
      next.crmNotes,
      next.nextFollowUp,
      next.lastContactedAt,
    ],
  );
  return next;
}

export async function saveCompany(company: Company) {
  return upsertCompany(company);
}

export async function deleteCompany(id: string) {
  await ready();
  const company = await getCompany(id);
  const people = await listEmployees(id);
  for (const employee of people) await deleteEmployee(employee.id);
  await execute("DELETE FROM company_payments WHERE company_id = $1", [id]);
  await execute("DELETE FROM company_followups WHERE company_id = $1", [id]);
  await execute("DELETE FROM users WHERE company_id = $1", [id]);
  await execute("DELETE FROM companies WHERE id = $1", [id]);
  await removeObject(company?.logo);
}

export async function listEmployees(companyId?: string) {
  await ready();
  const rows = companyId
    ? await query("SELECT * FROM employees WHERE company_id = $1 ORDER BY last_name", [companyId])
    : await query("SELECT * FROM employees ORDER BY last_name");
  return rows.map(mapEmployee);
}

export async function getEmployee(id: string) {
  await ready();
  const rows = await query("SELECT * FROM employees WHERE id = $1", [id]);
  return rows[0] ? mapEmployee(rows[0]) : undefined;
}

export async function upsertEmployee(employee: Employee, syncLogin = true) {
  await ready();
  await execute(
    `INSERT INTO employees (
      id, company_id, first_name, last_name, job_title, department, payroll_number, ni_number, tax_code, tax_region,
      ni_category, hourly_rate, overtime_multiplier, start_date, date_of_birth, student_loan, postgraduate_loan,
      pension_employee_percent, pension_employer_percent, pension_basis, payment_method, bank_sort_code,
      bank_account_last4, email, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
    ON CONFLICT (id) DO UPDATE SET
      company_id = EXCLUDED.company_id, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
      job_title = EXCLUDED.job_title, department = EXCLUDED.department, payroll_number = EXCLUDED.payroll_number,
      ni_number = EXCLUDED.ni_number, tax_code = EXCLUDED.tax_code, tax_region = EXCLUDED.tax_region,
      ni_category = EXCLUDED.ni_category, hourly_rate = EXCLUDED.hourly_rate, overtime_multiplier = EXCLUDED.overtime_multiplier,
      start_date = EXCLUDED.start_date, date_of_birth = EXCLUDED.date_of_birth, student_loan = EXCLUDED.student_loan,
      postgraduate_loan = EXCLUDED.postgraduate_loan, pension_employee_percent = EXCLUDED.pension_employee_percent,
      pension_employer_percent = EXCLUDED.pension_employer_percent, pension_basis = EXCLUDED.pension_basis,
      payment_method = EXCLUDED.payment_method, bank_sort_code = EXCLUDED.bank_sort_code,
      bank_account_last4 = EXCLUDED.bank_account_last4, email = EXCLUDED.email`,
    [
      employee.id,
      employee.companyId,
      employee.firstName,
      employee.lastName,
      employee.jobTitle,
      employee.department,
      employee.payrollNumber,
      employee.niNumber,
      employee.taxCode,
      employee.taxRegion,
      employee.niCategory,
      employee.hourlyRate,
      employee.overtimeMultiplier,
      employee.startDate,
      employee.dateOfBirth,
      employee.studentLoan,
      employee.postgraduateLoan,
      employee.pensionEmployeePercent,
      employee.pensionEmployerPercent,
      employee.pensionBasis,
      employee.paymentMethod,
      employee.bankSortCode,
      employee.bankAccountLast4,
      employee.email,
      employee.createdAt,
    ],
  );
  if (syncLogin) {
    await execute(
      `UPDATE users SET name = $1, company_id = $2, email = CASE WHEN $3 = '' THEN email ELSE $3 END
       WHERE employee_id = $4`,
      [`${employee.firstName} ${employee.lastName}`, employee.companyId, employee.email.toLowerCase(), employee.id],
    );
  }
  return employee;
}

export async function deleteEmployee(id: string) {
  await ready();
  const files = await listFiles(id);
  for (const file of files) await removeObject(file.storedName);
  await execute("DELETE FROM files WHERE employee_id = $1", [id]);
  await execute("DELETE FROM users WHERE employee_id = $1", [id]);
  await execute("DELETE FROM rota WHERE employee_id = $1", [id]);
  await execute("DELETE FROM payslips WHERE employee_id = $1", [id]);
  await execute("DELETE FROM hour_logs WHERE employee_id = $1", [id]);
  await execute("DELETE FROM payments WHERE employee_id = $1", [id]);
  await execute("DELETE FROM employees WHERE id = $1", [id]);
}

export async function listUsers(companyId?: string) {
  await ready();
  const rows = companyId
    ? await query("SELECT * FROM users WHERE company_id = $1", [companyId])
    : await query("SELECT * FROM users");
  return rows.map(mapUser);
}

export async function listAgents(companyId?: string) {
  const users = await listUsers(companyId);
  return users.filter((user) => user.role === "agent");
}

export async function getUser(id: string) {
  await ready();
  const rows = await query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ? mapUser(rows[0]) : undefined;
}

export async function getUserByEmail(email: string) {
  await ready();
  const rows = await query("SELECT * FROM users WHERE lower(email) = lower($1)", [email]);
  return rows[0] ? mapUser(rows[0]) : undefined;
}

export async function upsertUser(user: User) {
  await ready();
  await execute(
    `INSERT INTO users (id, email, password_hash, name, role, company_id, employee_id, created_at, avatar, phone, job_title, notify_email, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, role = EXCLUDED.role,
       company_id = EXCLUDED.company_id, employee_id = EXCLUDED.employee_id, avatar = EXCLUDED.avatar,
       phone = EXCLUDED.phone, job_title = EXCLUDED.job_title, notify_email = EXCLUDED.notify_email, status = EXCLUDED.status`,
    [
      user.id,
      user.email,
      user.passwordHash,
      user.name,
      user.role,
      user.companyId,
      user.employeeId,
      user.createdAt,
      user.avatar || "",
      user.phone || "",
      user.jobTitle || "",
      user.notifyEmail !== false,
      accountStatus(user),
    ],
  );
  return user;
}

export async function deleteUser(id: string) {
  await ready();
  await execute("DELETE FROM users WHERE id = $1", [id]);
}

export async function setStaffLogin(employee: Employee, password?: string) {
  if (!employee.email) return;
  await ready();
  const existing = (await query("SELECT * FROM users WHERE employee_id = $1", [employee.id])).map(mapUser)[0];
  if (existing) {
    existing.email = employee.email.toLowerCase();
    existing.name = `${employee.firstName} ${employee.lastName}`;
    existing.role = "user";
    existing.companyId = employee.companyId;
    if (password) {
      existing.passwordHash = hashPassword(password);
      if (existing.status === "pending") existing.status = "active";
    }
    await upsertUser(existing);
    return;
  }
  if (!password) return;
  await upsertUser({
    id: `user_${employee.id}`,
    email: employee.email.toLowerCase(),
    passwordHash: hashPassword(password),
    name: `${employee.firstName} ${employee.lastName}`,
    role: "user",
    companyId: employee.companyId,
    employeeId: employee.id,
    createdAt: new Date().toISOString(),
    status: "active",
  });
}

export async function listPayslips(employeeId?: string, companyId?: string) {
  await ready();
  const ids = await companyEmployeeIds(companyId);
  let rows = employeeId
    ? await query("SELECT data FROM payslips WHERE employee_id = $1", [employeeId])
    : await query("SELECT data FROM payslips");
  const slips = rows.map((row) => withPayslipApproval(json<Payslip>(row.data, {} as Payslip))).filter((slip) => slip.id);
  return slips
    .filter((slip) => (!employeeId || slip.employeeId === employeeId) && (!ids || ids.has(slip.employeeId)))
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate) || b.createdAt.localeCompare(a.createdAt));
}

export async function getPayslip(id: string) {
  await ready();
  const rows = await query("SELECT data FROM payslips WHERE id = $1", [id]);
  return rows[0] ? withPayslipApproval(json<Payslip>(rows[0].data, {} as Payslip)) : undefined;
}

function paymentFromPayslip(payslip: Payslip) {
  return {
    id: `pay_${payslip.id}`,
    employeeId: payslip.employeeId,
    payslipId: payslip.id,
    amount: payslip.calculation.netPay,
    status: "due" as const,
    dueDate: payslip.paymentDate,
    paidDate: "",
    method: payslip.snapshot.paymentMethod,
    reference: payslip.snapshot.payrollNumber,
    notes: `Net pay for ${payslip.periodStart} to ${payslip.periodEnd}`,
    createdAt: payslip.createdAt,
  };
}

export async function addPayslip(payslip: Payslip) {
  await ready();
  const next = withPayslipApproval(payslip, "pending");
  await execute(
    `INSERT INTO payslips (id, employee_id, payment_date, created_at, status, data) VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
    [next.id, next.employeeId, next.paymentDate, next.createdAt, next.status, JSON.stringify(next)],
  );
  if (next.status === "approved") await upsertPayment(paymentFromPayslip(next));
  return next;
}

export async function updatePayslip(payslip: Payslip) {
  await ready();
  const next = withPayslipApproval(payslip);
  await execute(
    `UPDATE payslips SET payment_date = $1, status = $2, data = $3::jsonb WHERE id = $4`,
    [next.paymentDate, next.status, JSON.stringify(next), next.id],
  );
  const existing = await getPayment(`pay_${next.id}`);
  if (next.status === "approved") {
    const payment = paymentFromPayslip(next);
    if (existing) {
      await upsertPayment({ ...existing, amount: payment.amount, dueDate: payment.dueDate, notes: payment.notes });
    } else {
      await upsertPayment(payment);
    }
  } else if (existing?.status === "due") {
    await deletePayment(existing.id);
  }
  return next;
}

export async function deletePayslip(id: string) {
  await ready();
  await execute("DELETE FROM payments WHERE payslip_id = $1", [id]);
  await execute("DELETE FROM payslips WHERE id = $1", [id]);
}

export async function listRota(weekStart?: string, companyId?: string) {
  await ready();
  const ids = await companyEmployeeIds(companyId);
  const rows = weekStart
    ? await query("SELECT * FROM rota WHERE week_start = $1", [weekStart])
    : await query("SELECT * FROM rota");
  return rows.map(mapRota).filter((entry) => !ids || ids.has(entry.employeeId));
}

export async function upsertRotaEntry(entry: RotaEntry) {
  await ready();
  const next = { ...entry, days: { ...emptyDays(), ...entry.days } };
  await execute(
    `INSERT INTO rota (id, employee_id, week_start, days, overtime_hours, notes)
     VALUES ($1,$2,$3,$4::jsonb,$5,$6)
     ON CONFLICT (employee_id, week_start) DO UPDATE SET
       days = EXCLUDED.days, overtime_hours = EXCLUDED.overtime_hours, notes = EXCLUDED.notes, id = EXCLUDED.id`,
    [next.id, next.employeeId, next.weekStart, JSON.stringify(next.days), next.overtimeHours, next.notes],
  );
  return next;
}

export async function listHourLogs(employeeId?: string, companyId?: string) {
  await ready();
  const ids = await companyEmployeeIds(companyId);
  const rows = employeeId
    ? await query("SELECT * FROM hour_logs WHERE employee_id = $1 ORDER BY date DESC, created_at DESC", [employeeId])
    : await query("SELECT * FROM hour_logs ORDER BY date DESC, created_at DESC");
  return rows.map(mapHour).filter((log) => !ids || ids.has(log.employeeId));
}

export async function getHourLog(id: string) {
  await ready();
  const rows = await query("SELECT * FROM hour_logs WHERE id = $1", [id]);
  return rows[0] ? mapHour(rows[0]) : undefined;
}

async function syncRotaFromLogs(employeeId: string, date: string) {
  const weekStart = startOfWeek(new Date(`${date}T12:00:00`));
  const logs = (await listHourLogs(employeeId)).filter(
    (log) => log.status === "approved" && startOfWeek(new Date(`${log.date}T12:00:00`)) === weekStart,
  );
  const days = emptyDays();
  let overtimeHours = 0;
  for (const log of logs) {
    days[weekdayFromIso(log.date)] += log.hours;
    overtimeHours += log.overtimeHours;
  }
  await upsertRotaEntry({
    id: `rota_${employeeId}_${weekStart}`,
    employeeId,
    weekStart,
    days,
    overtimeHours,
    notes: logs.length ? "Synced from approved hour records" : "",
  });
}

export async function upsertHourLog(log: HourLog, sync = true) {
  await ready();
  const next = withHourApproval({ ...log, hours: Number(log.hours) || 0, overtimeHours: Number(log.overtimeHours) || 0 }, "pending");
  await execute(
    `INSERT INTO hour_logs (id, employee_id, date, hours, overtime_hours, notes, created_at, updated_at, status, review_note, reviewed_at, reviewed_by, start_time, end_time)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (id) DO UPDATE SET
       date = EXCLUDED.date, hours = EXCLUDED.hours, overtime_hours = EXCLUDED.overtime_hours,
       notes = EXCLUDED.notes, updated_at = EXCLUDED.updated_at, status = EXCLUDED.status,
       review_note = EXCLUDED.review_note, reviewed_at = EXCLUDED.reviewed_at, reviewed_by = EXCLUDED.reviewed_by,
       start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time`,
    [
      next.id,
      next.employeeId,
      next.date,
      next.hours,
      next.overtimeHours,
      next.notes,
      next.createdAt,
      next.updatedAt,
      next.status,
      next.reviewNote || "",
      next.reviewedAt || "",
      next.reviewedBy || "",
      next.startTime || "",
      next.endTime || "",
    ],
  );
  if (sync) await syncRotaFromLogs(next.employeeId, next.date);
  return next;
}

export async function deleteHourLog(id: string) {
  await ready();
  const existing = await getHourLog(id);
  await execute("DELETE FROM hour_logs WHERE id = $1", [id]);
  if (existing) await syncRotaFromLogs(existing.employeeId, existing.date);
}

export async function listPayments(employeeId?: string, companyId?: string) {
  await ready();
  const ids = await companyEmployeeIds(companyId);
  const rows = employeeId
    ? await query("SELECT * FROM payments WHERE employee_id = $1 ORDER BY due_date DESC, created_at DESC", [employeeId])
    : await query("SELECT * FROM payments ORDER BY due_date DESC, created_at DESC");
  return rows.map(mapPayment).filter((payment) => !ids || ids.has(payment.employeeId));
}

export async function getPayment(id: string) {
  await ready();
  const rows = await query("SELECT * FROM payments WHERE id = $1", [id]);
  return rows[0] ? mapPayment(rows[0]) : undefined;
}

export async function upsertPayment(payment: Payment) {
  await ready();
  await execute(
    `INSERT INTO payments (id, employee_id, payslip_id, amount, status, due_date, paid_date, method, reference, notes, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (id) DO UPDATE SET
       amount = EXCLUDED.amount, status = EXCLUDED.status, due_date = EXCLUDED.due_date, paid_date = EXCLUDED.paid_date,
       method = EXCLUDED.method, reference = EXCLUDED.reference, notes = EXCLUDED.notes`,
    [
      payment.id,
      payment.employeeId,
      payment.payslipId,
      payment.amount,
      payment.status,
      payment.dueDate,
      payment.paidDate,
      payment.method,
      payment.reference,
      payment.notes,
      payment.createdAt,
    ],
  );
  return payment;
}

export async function deletePayment(id: string) {
  await ready();
  await execute("DELETE FROM payments WHERE id = $1", [id]);
}

export async function listCompanyPayments(companyId?: string) {
  await ready();
  const rows = companyId
    ? await query("SELECT * FROM company_payments WHERE company_id = $1 ORDER BY due_date DESC, created_at DESC", [companyId])
    : await query("SELECT * FROM company_payments ORDER BY due_date DESC, created_at DESC");
  return rows.map(mapCompanyPayment);
}

export async function getCompanyPayment(id: string) {
  await ready();
  const rows = await query("SELECT * FROM company_payments WHERE id = $1", [id]);
  return rows[0] ? mapCompanyPayment(rows[0]) : undefined;
}

export async function upsertCompanyPayment(payment: CompanyPayment) {
  await ready();
  await execute(
    `INSERT INTO company_payments (id, company_id, amount, status, due_date, paid_date, method, reference, notes, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (id) DO UPDATE SET
       amount = EXCLUDED.amount, status = EXCLUDED.status, due_date = EXCLUDED.due_date, paid_date = EXCLUDED.paid_date,
       method = EXCLUDED.method, reference = EXCLUDED.reference, notes = EXCLUDED.notes`,
    [
      payment.id,
      payment.companyId,
      payment.amount,
      payment.status,
      payment.dueDate,
      payment.paidDate,
      payment.method,
      payment.reference,
      payment.notes,
      payment.createdAt,
    ],
  );
  return payment;
}

export async function deleteCompanyPayment(id: string) {
  await ready();
  await execute("DELETE FROM company_payments WHERE id = $1", [id]);
}

export async function listCompanyFollowUps(companyId?: string) {
  await ready();
  const rows = companyId
    ? await query("SELECT * FROM company_followups WHERE company_id = $1 ORDER BY due_date ASC, created_at DESC", [companyId])
    : await query("SELECT * FROM company_followups ORDER BY due_date ASC, created_at DESC");
  return rows.map(mapCompanyFollowUp);
}

export async function getCompanyFollowUp(id: string) {
  await ready();
  const rows = await query("SELECT * FROM company_followups WHERE id = $1", [id]);
  return rows[0] ? mapCompanyFollowUp(rows[0]) : undefined;
}

export async function upsertCompanyFollowUp(item: CompanyFollowUp) {
  await ready();
  await execute(
    `INSERT INTO company_followups (id, company_id, note, due_date, completed_at, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET
       note = EXCLUDED.note, due_date = EXCLUDED.due_date, completed_at = EXCLUDED.completed_at`,
    [item.id, item.companyId, item.note, item.dueDate, item.completedAt, item.createdAt],
  );
  return item;
}

export async function deleteCompanyFollowUp(id: string) {
  await ready();
  await execute("DELETE FROM company_followups WHERE id = $1", [id]);
}

export async function listFiles(employeeId?: string, companyId?: string) {
  await ready();
  const ids = await companyEmployeeIds(companyId);
  const rows = employeeId
    ? await query("SELECT * FROM files WHERE employee_id = $1 ORDER BY uploaded_at DESC", [employeeId])
    : await query("SELECT * FROM files ORDER BY uploaded_at DESC");
  return rows.map(mapFile).filter((file) => !ids || ids.has(file.employeeId));
}

export async function getFileRecord(id: string) {
  await ready();
  const rows = await query("SELECT * FROM files WHERE id = $1", [id]);
  return rows[0] ? mapFile(rows[0]) : undefined;
}

export async function addFileRecord(file: RecordFile) {
  await ready();
  await execute(
    `INSERT INTO files (id, employee_id, original_name, stored_name, mime_type, size, category, notes, uploaded_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      file.id,
      file.employeeId,
      file.originalName,
      file.storedName,
      file.mimeType,
      file.size,
      file.category,
      file.notes,
      file.uploadedAt,
    ],
  );
  return file;
}

export async function deleteFileRecord(id: string) {
  await ready();
  const file = await getFileRecord(id);
  if (file) await removeObject(file.storedName);
  await execute("DELETE FROM files WHERE id = $1", [id]);
}

export async function hoursSummary(employeeId: string) {
  const logs = await listHourLogs(employeeId);
  const hours = logs.reduce((sum, log) => sum + log.hours + log.overtimeHours, 0);
  const employee = await getEmployee(employeeId);
  const rate = employee?.hourlyRate || 0;
  const overtimeRate = rate * (employee?.overtimeMultiplier || 1.5);
  const gross = logs.reduce((sum, log) => sum + log.hours * rate + log.overtimeHours * overtimeRate, 0);
  return { hours, gross, count: logs.length };
}

export async function paymentSummary(employeeId: string) {
  const payments = await listPayments(employeeId);
  const due = payments.filter((item) => item.status === "due").reduce((sum, item) => sum + item.amount, 0);
  const received = payments.filter((item) => item.status === "received").reduce((sum, item) => sum + item.amount, 0);
  return { due, received, count: payments.length };
}
