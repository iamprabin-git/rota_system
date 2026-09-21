import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { withCompanyDefaults } from "./company";
import { hashPassword } from "./passwords";
import { startOfWeek } from "./format";
import { accountStatus, withHourApproval, withPayslipApproval } from "./approvals";
import type {
  Company,
  CompanyFollowUp,
  CompanyPayment,
  Database,
  Employee,
  HourLog,
  Payment,
  Payslip,
  RecordFile,
  RotaEntry,
  User,
  UserRole,
  Weekday,
} from "./types";
import { WEEKDAYS } from "./types";
import { emptyDays, sumHours } from "./uk-payroll";

export const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
export const FILES_DIR = path.join(DATA_DIR, "files");
export const AVATARS_DIR = path.join(DATA_DIR, "avatars");

export function removeAvatarFile(storedName?: string) {
  if (!storedName) return;
  try {
    rmSync(path.join(AVATARS_DIR, storedName), { force: true });
  } catch {
    /* ignore missing file */
  }
}

export const COMPANY_RS = "co_rotasystem";
export const COMPANY_HV = "co_harbourview";

const STAFF_PASSWORD = "Hours2026";
const ADMIN_PASSWORD = "RotaAdmin26";
const AGENT_PASSWORD = "Agent2026";

function rotasystemCompany(): Company {
  return {
    id: COMPANY_RS,
    name: "RotaSystem Ltd",
    tradingName: "RotaSystem Care",
    addressLine1: "14 Clerkenwell Green",
    addressLine2: "",
    city: "London",
    postcode: "EC1R 0DP",
    payeReference: "123/RS12345",
    accountsOfficeRef: "123PA00012345",
    email: "payroll@rotasystem.example",
    phone: "020 7946 0123",
    logo: "",
    access: "allowed",
    live: "active",
    crmStage: "active",
    crmNotes: "",
    nextFollowUp: "",
    lastContactedAt: "",
  };
}

function harbourviewCompany(): Company {
  return {
    id: COMPANY_HV,
    name: "Harbourview Care Ltd",
    tradingName: "Harbourview Care",
    addressLine1: "8 Queen's Quay",
    addressLine2: "",
    city: "Belfast",
    postcode: "BT3 9DT",
    payeReference: "475/HV88210",
    accountsOfficeRef: "475PA00088210",
    email: "payroll@harbourview.example",
    phone: "028 9032 4100",
    logo: "",
    access: "allowed",
    live: "active",
    crmStage: "active",
    crmNotes: "",
    nextFollowUp: "",
    lastContactedAt: "",
  };
}

export function blankCompany(): Company {
  return {
    id: "",
    name: "",
    tradingName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    payeReference: "",
    accountsOfficeRef: "",
    email: "",
    phone: "",
    logo: "",
    access: "allowed",
    live: "active",
    crmStage: "active",
    crmNotes: "",
    nextFollowUp: "",
    lastContactedAt: "",
  };
}

function seedEmployees(): Employee[] {
  const now = new Date().toISOString();
  return [
    {
      id: "emp_amira",
      firstName: "Amira",
      lastName: "Khan",
      jobTitle: "Healthcare Assistant",
      department: "Community Care",
      payrollNumber: "RS-0142",
      niNumber: "AB123456C",
      taxCode: "1257L",
      taxRegion: "england",
      niCategory: "A",
      hourlyRate: 13.5,
      overtimeMultiplier: 1.5,
      startDate: "2024-06-03",
      dateOfBirth: "1994-02-18",
      studentLoan: "plan2",
      postgraduateLoan: false,
      pensionEmployeePercent: 5,
      pensionEmployerPercent: 3,
      pensionBasis: "qualifying",
      paymentMethod: "bacs",
      bankSortCode: "04-00-04",
      bankAccountLast4: "4412",
      email: "amira@rotasystem.local",
      companyId: COMPANY_RS,
      createdAt: now,
    },
    {
      id: "emp_james",
      firstName: "James",
      lastName: "O'Neill",
      jobTitle: "Shift Supervisor",
      department: "Residential",
      payrollNumber: "RS-0088",
      niNumber: "JK998877A",
      taxCode: "1257L",
      taxRegion: "england",
      niCategory: "A",
      hourlyRate: 16.8,
      overtimeMultiplier: 1.5,
      startDate: "2022-11-14",
      dateOfBirth: "1988-09-02",
      studentLoan: "none",
      postgraduateLoan: false,
      pensionEmployeePercent: 5,
      pensionEmployerPercent: 3,
      pensionBasis: "qualifying",
      paymentMethod: "bacs",
      bankSortCode: "20-00-00",
      bankAccountLast4: "7731",
      email: "james@rotasystem.local",
      companyId: COMPANY_RS,
      createdAt: now,
    },
    {
      id: "emp_fraser",
      firstName: "Fraser",
      lastName: "MacLeod",
      jobTitle: "Support Worker",
      department: "Scotland Hub",
      payrollNumber: "RS-0219",
      niNumber: "NW556677B",
      taxCode: "S1257L",
      taxRegion: "scotland",
      niCategory: "A",
      hourlyRate: 12.71,
      overtimeMultiplier: 1.5,
      startDate: "2025-04-07",
      dateOfBirth: "2002-12-09",
      studentLoan: "plan4",
      postgraduateLoan: false,
      pensionEmployeePercent: 5,
      pensionEmployerPercent: 3,
      pensionBasis: "qualifying",
      paymentMethod: "bacs",
      bankSortCode: "83-04-00",
      bankAccountLast4: "1904",
      email: "fraser@rotasystem.local",
      companyId: COMPANY_RS,
      createdAt: now,
    },
    {
      id: "emp_niamh",
      firstName: "Niamh",
      lastName: "Boyle",
      jobTitle: "Care Assistant",
      department: "Harbour House",
      payrollNumber: "HV-0104",
      niNumber: "PB334455C",
      taxCode: "1257L",
      taxRegion: "ni",
      niCategory: "A",
      hourlyRate: 12.9,
      overtimeMultiplier: 1.5,
      startDate: "2025-01-13",
      dateOfBirth: "1999-07-21",
      studentLoan: "plan2",
      postgraduateLoan: false,
      pensionEmployeePercent: 5,
      pensionEmployerPercent: 3,
      pensionBasis: "qualifying",
      paymentMethod: "bacs",
      bankSortCode: "93-80-12",
      bankAccountLast4: "2290",
      email: "niamh@harbourview.local",
      companyId: COMPANY_HV,
      createdAt: now,
    },
  ];
}

function seedUsers(employees: Employee[]): User[] {
  const now = new Date().toISOString();
  return [
    {
      id: "user_admin",
      email: "admin@rotasystem.local",
      passwordHash: hashPassword(ADMIN_PASSWORD),
      name: "Platform admin",
      role: "admin",
      companyId: null,
      employeeId: null,
      createdAt: now,
      status: "active" as const,
    },
    {
      id: "user_agent_rs",
      email: "agent@rotasystem.local",
      passwordHash: hashPassword(AGENT_PASSWORD),
      name: "Alex Reid",
      role: "agent",
      companyId: COMPANY_RS,
      employeeId: null,
      createdAt: now,
      status: "active" as const,
    },
    {
      id: "user_agent_hv",
      email: "priya@harbourview.local",
      passwordHash: hashPassword(AGENT_PASSWORD),
      name: "Priya Shah",
      role: "agent",
      companyId: COMPANY_HV,
      employeeId: null,
      createdAt: now,
      status: "active" as const,
    },
    ...employees.map((employee) => ({
      id: `user_${employee.id}`,
      email: employee.email,
      passwordHash: hashPassword(STAFF_PASSWORD),
      name: `${employee.firstName} ${employee.lastName}`,
      role: "user" as const,
      companyId: employee.companyId,
      employeeId: employee.id,
      createdAt: now,
      status: "active" as const,
    })),
  ];
}

function seed(): Database {
  const employees = seedEmployees();
  return {
    companies: [rotasystemCompany(), harbourviewCompany()],
    employees,
    users: seedUsers(employees),
    rota: [],
    payslips: [],
    hourLogs: [],
    payments: [],
    companyPayments: [],
    companyFollowUps: [],
    files: [],
  };
}

function weekdayFromIso(iso: string): Weekday {
  const date = new Date(`${iso}T12:00:00`);
  const day = date.getDay();
  return day === 0 ? "sun" : WEEKDAYS[day - 1];
}

function withEmail(employee: Employee): Employee {
  if (employee.email) return employee;
  const fallback: Record<string, string> = {
    emp_amira: "amira@rotasystem.local",
    emp_james: "james@rotasystem.local",
    emp_fraser: "fraser@rotasystem.local",
    emp_niamh: "niamh@harbourview.local",
  };
  return {
    ...employee,
    email: fallback[employee.id] || `${employee.id.replace("emp_", "")}@rotasystem.local`,
  };
}

function employeeIdsFor(employees: Employee[], companyId?: string): Set<string> | null {
  if (!companyId) return null;
  return new Set(employees.filter((employee) => employee.companyId === companyId).map((employee) => employee.id));
}

function belongsToCompany(employeeId: string, ids: Set<string> | null): boolean {
  return !ids || ids.has(employeeId);
}

type Stored = Partial<Database> & { company?: Company };

function migrateCompanies(parsed: Stored): Company[] {
  if (parsed.companies?.length) {
    return parsed.companies.map((company) => ({
      ...rotasystemCompany(),
      ...company,
      id: company.id || COMPANY_RS,
    }));
  }
  return [{ ...rotasystemCompany(), ...parsed.company, id: parsed.company?.id || COMPANY_RS }];
}

function migrateUsers(users: User[], employees: Employee[], companies: Company[]): { users: User[]; dirty: boolean } {
  const defaultCompanyId = companies[0]?.id || COMPANY_RS;
  const byEmployee = new Map(employees.map((employee) => [employee.id, employee]));
  let dirty = false;
  const next = users.map((user) => {
    const rawRole = user.role as string;
    let role: UserRole = user.role;
    let companyId = user.companyId ?? null;
    if (rawRole === "staff") {
      role = "user";
      dirty = true;
    } else if (rawRole === "admin" && user.email !== "admin@rotasystem.local") {
      role = "agent";
      dirty = true;
    }
    if (role === "admin") {
      if (companyId !== null) dirty = true;
      companyId = null;
    } else if (role === "user") {
      const linked = user.employeeId ? byEmployee.get(user.employeeId) : undefined;
      const nextCompany = linked?.companyId || companyId || defaultCompanyId;
      if (companyId !== nextCompany) dirty = true;
      companyId = nextCompany;
    } else if (role === "agent" && !companyId) {
      companyId = defaultCompanyId;
      dirty = true;
    }
    if (user.role !== role) dirty = true;
    const status = user.status || "active";
    if (user.status !== status) dirty = true;
    return { ...user, role, companyId, status };
  });

  if (!next.some((user) => user.role === "admin")) {
    next.unshift({
      id: "user_admin",
      email: "admin@rotasystem.local",
      passwordHash: hashPassword(ADMIN_PASSWORD),
      name: "Platform admin",
      role: "admin",
      companyId: null,
      employeeId: null,
      createdAt: new Date().toISOString(),
      status: "active",
    });
    dirty = true;
  }

  for (const company of companies) {
    if (next.some((user) => user.role === "agent" && user.companyId === company.id)) continue;
    next.push({
      id: `user_agent_${company.id}`,
      email:
        company.id === COMPANY_HV ? "priya@harbourview.local" : `agent@${company.id.replace("co_", "")}.local`,
      passwordHash: hashPassword(AGENT_PASSWORD),
      name: company.id === COMPANY_HV ? "Priya Shah" : "Alex Reid",
      role: "agent",
      companyId: company.id,
      employeeId: null,
      createdAt: new Date().toISOString(),
      status: "active",
    });
    dirty = true;
  }

  return { users: next, dirty };
}

function ensureDb(): Database {
  mkdirSync(DATA_DIR, { recursive: true });
  mkdirSync(FILES_DIR, { recursive: true });
  mkdirSync(AVATARS_DIR, { recursive: true });
  try {
    const raw = readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Stored;
    const companies = migrateCompanies(parsed);
    const legacy = !parsed.companies?.length;
    if (legacy && !companies.some((company) => company.id === COMPANY_HV)) {
      companies.push(harbourviewCompany());
    }
    const defaultCompanyId = companies[0]?.id || COMPANY_RS;
    const employees = (parsed.employees ?? []).map((employee) => {
      const withMail = withEmail(employee as Employee);
      return { ...withMail, companyId: withMail.companyId || defaultCompanyId };
    });
    if (legacy && !employees.some((employee) => employee.id === "emp_niamh")) {
      const seeded = seedEmployees().find((employee) => employee.id === "emp_niamh");
      if (seeded) employees.push(seeded);
    }
    let dirty =
      legacy ||
      JSON.stringify(parsed.employees) !== JSON.stringify(employees);

    let users = parsed.users ?? [];
    if (users.length === 0) {
      users = seedUsers(employees.length ? employees : seedEmployees());
      dirty = true;
    } else {
      const migrated = migrateUsers(users as User[], employees, companies);
      users = migrated.users;
      dirty = dirty || migrated.dirty;
    }
    for (const employee of employees) {
      if (!employee.email) continue;
      if (users.some((user) => user.employeeId === employee.id)) continue;
      users.push({
        id: `user_${employee.id}`,
        email: employee.email.toLowerCase(),
        passwordHash: hashPassword(STAFF_PASSWORD),
        name: `${employee.firstName} ${employee.lastName}`,
        role: "user",
        companyId: employee.companyId,
        employeeId: employee.id,
        createdAt: new Date().toISOString(),
        status: "active",
      });
      dirty = true;
    }

    const payslips = parsed.payslips ?? [];
    let payments = parsed.payments ?? [];
    if ((parsed.payments?.length ?? 0) === 0 && payslips.length > 0) {
      payments = payslips.map((slip) => ({
        id: `pay_${slip.id}`,
        employeeId: slip.employeeId,
        payslipId: slip.id,
        amount: slip.calculation.netPay,
        status: "due" as const,
        dueDate: slip.paymentDate,
        paidDate: "",
        method: slip.snapshot.paymentMethod,
        reference: slip.snapshot.payrollNumber,
        notes: `Net pay for ${slip.periodStart} to ${slip.periodEnd}`,
        createdAt: slip.createdAt,
      }));
      dirty = true;
    }
    const db: Database = {
      companies,
      employees,
      users,
      rota: parsed.rota ?? [],
      payslips,
      hourLogs: parsed.hourLogs ?? [],
      payments,
      companyPayments: parsed.companyPayments ?? [],
      companyFollowUps: parsed.companyFollowUps ?? [],
      files: parsed.files ?? [],
    };
    if (dirty) save(db);
    return db;
  } catch {
    const initial = seed();
    writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function save(db: Database) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getDb(): Database {
  return ensureDb();
}

export function listCompanies(): Company[] {
  return getDb().companies.sort((a, b) => a.name.localeCompare(b.name));
}

export function getCompany(id?: string | null): Company | undefined {
  if (!id) return undefined;
  return getDb().companies.find((company) => company.id === id);
}

export function upsertCompany(company: Company): Company {
  const db = getDb();
  const next = withCompanyDefaults({ ...company, id: company.id || `co_${crypto.randomUUID()}` });
  const index = db.companies.findIndex((item) => item.id === next.id);
  if (index === -1) db.companies.push(next);
  else db.companies[index] = next;
  save(db);
  return next;
}

export function deleteCompany(id: string) {
  const db = getDb();
  const employeeIds = db.employees.filter((employee) => employee.companyId === id).map((employee) => employee.id);
  for (const employeeId of employeeIds) {
    deleteEmployee(employeeId);
  }
  const latest = getDb();
  latest.companies = latest.companies.filter((company) => company.id !== id);
  latest.users = latest.users.filter((user) => user.companyId !== id);
  latest.companyPayments = latest.companyPayments.filter((item) => item.companyId !== id);
  latest.companyFollowUps = latest.companyFollowUps.filter((item) => item.companyId !== id);
  save(latest);
}

export function saveCompany(company: Company): Company {
  return upsertCompany(company);
}

export function listEmployees(companyId?: string): Employee[] {
  return getDb()
    .employees.filter((employee) => !companyId || employee.companyId === companyId)
    .sort((a, b) => a.lastName.localeCompare(b.lastName));
}

export function getEmployee(id: string): Employee | undefined {
  return getDb().employees.find((employee) => employee.id === id);
}

export function upsertEmployee(employee: Employee): Employee {
  const db = getDb();
  const index = db.employees.findIndex((item) => item.id === employee.id);
  if (index === -1) db.employees.push(employee);
  else db.employees[index] = employee;
  const user = db.users.find((item) => item.employeeId === employee.id);
  if (user) {
    user.name = `${employee.firstName} ${employee.lastName}`;
    user.companyId = employee.companyId;
    if (employee.email) user.email = employee.email.toLowerCase();
  }
  save(db);
  return employee;
}

export function deleteEmployee(id: string) {
  const db = getDb();
  const files = db.files.filter((file) => file.employeeId === id);
  for (const file of files) {
    try {
      rmSync(path.join(FILES_DIR, file.storedName), { force: true });
    } catch {
      /* ignore missing file */
    }
  }
  db.employees = db.employees.filter((employee) => employee.id !== id);
  db.users = db.users.filter((user) => user.employeeId !== id);
  db.rota = db.rota.filter((entry) => entry.employeeId !== id);
  db.payslips = db.payslips.filter((slip) => slip.employeeId !== id);
  db.hourLogs = db.hourLogs.filter((log) => log.employeeId !== id);
  db.payments = db.payments.filter((payment) => payment.employeeId !== id);
  db.files = db.files.filter((file) => file.employeeId !== id);
  save(db);
}

export function listUsers(companyId?: string): User[] {
  return getDb()
    .users.filter((user) => !companyId || user.companyId === companyId)
    .map((user) => ({ ...user, status: accountStatus(user) }));
}

export function listAgents(companyId?: string): User[] {
  return listUsers(companyId).filter((user) => user.role === "agent");
}

export function getUser(id: string): User | undefined {
  const user = getDb().users.find((item) => item.id === id);
  return user ? { ...user, status: accountStatus(user) } : undefined;
}

export function getUserByEmail(email: string): User | undefined {
  const user = getDb().users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  return user ? { ...user, status: accountStatus(user) } : undefined;
}

export function upsertUser(user: User): User {
  const db = getDb();
  const index = db.users.findIndex((item) => item.id === user.id);
  if (index === -1) db.users.push(user);
  else db.users[index] = user;
  save(db);
  return user;
}

export function deleteUser(id: string) {
  const db = getDb();
  db.users = db.users.filter((user) => user.id !== id);
  save(db);
}

export function setStaffLogin(employee: Employee, password?: string) {
  if (!employee.email) return;
  const db = getDb();
  const existing = db.users.find((user) => user.employeeId === employee.id);
  if (existing) {
    existing.email = employee.email.toLowerCase();
    existing.name = `${employee.firstName} ${employee.lastName}`;
    existing.role = "user";
    existing.companyId = employee.companyId;
    if (password) {
      existing.passwordHash = hashPassword(password);
      if (existing.status === "pending") existing.status = "active";
    }
    save(db);
    return;
  }
  if (!password) return;
  db.users.push({
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
  save(db);
}

export function listPayslips(employeeId?: string, companyId?: string): Payslip[] {
  const ids = employeeIdsFor(getDb().employees, companyId);
  return getDb()
    .payslips.filter((slip) => (!employeeId || slip.employeeId === employeeId) && belongsToCompany(slip.employeeId, ids))
    .map((slip) => withPayslipApproval(slip))
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate) || b.createdAt.localeCompare(a.createdAt));
}

export function getPayslip(id: string): Payslip | undefined {
  const slip = getDb().payslips.find((item) => item.id === id);
  return slip ? withPayslipApproval(slip) : undefined;
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

export function addPayslip(payslip: Payslip): Payslip {
  const db = getDb();
  const next = withPayslipApproval(payslip, "pending");
  db.payslips.unshift(next);
  if (next.status === "approved") db.payments.unshift(paymentFromPayslip(next));
  save(db);
  return next;
}

export function updatePayslip(payslip: Payslip): Payslip {
  const db = getDb();
  const next = withPayslipApproval(payslip);
  const index = db.payslips.findIndex((item) => item.id === next.id);
  if (index === -1) db.payslips.unshift(next);
  else db.payslips[index] = next;
  const payIndex = db.payments.findIndex((item) => item.payslipId === next.id);
  if (next.status === "approved") {
    const payment = paymentFromPayslip(next);
    if (payIndex === -1) db.payments.unshift(payment);
    else db.payments[payIndex] = { ...db.payments[payIndex], amount: payment.amount, dueDate: payment.dueDate, notes: payment.notes };
  } else if (payIndex !== -1 && db.payments[payIndex].status === "due") {
    db.payments.splice(payIndex, 1);
  }
  save(db);
  return next;
}

export function deletePayslip(id: string) {
  const db = getDb();
  db.payslips = db.payslips.filter((slip) => slip.id !== id);
  db.payments = db.payments.filter((payment) => payment.payslipId !== id);
  save(db);
}

export function listRota(weekStart?: string, companyId?: string): RotaEntry[] {
  const ids = employeeIdsFor(getDb().employees, companyId);
  return getDb().rota.filter(
    (entry) => (!weekStart || entry.weekStart === weekStart) && belongsToCompany(entry.employeeId, ids),
  );
}

export function upsertRotaEntry(entry: RotaEntry): RotaEntry {
  const db = getDb();
  const index = db.rota.findIndex(
    (item) => item.employeeId === entry.employeeId && item.weekStart === entry.weekStart,
  );
  const next = {
    ...entry,
    days: { ...emptyDays(), ...entry.days },
  };
  if (index === -1) db.rota.push(next);
  else db.rota[index] = { ...db.rota[index], ...next };
  save(db);
  return next;
}

export function listHourLogs(employeeId?: string, companyId?: string): HourLog[] {
  const ids = employeeIdsFor(getDb().employees, companyId);
  return getDb()
    .hourLogs.filter((log) => (!employeeId || log.employeeId === employeeId) && belongsToCompany(log.employeeId, ids))
    .map((log) => withHourApproval(log))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function getHourLog(id: string): HourLog | undefined {
  const log = getDb().hourLogs.find((item) => item.id === id);
  return log ? withHourApproval(log) : undefined;
}

function syncRotaFromLogs(employeeId: string, date: string) {
  const weekStart = startOfWeek(new Date(`${date}T12:00:00`));
  const logs = listHourLogs(employeeId).filter(
    (log) => log.status === "approved" && startOfWeek(new Date(`${log.date}T12:00:00`)) === weekStart,
  );
  const days = emptyDays();
  let overtimeHours = 0;
  for (const log of logs) {
    days[weekdayFromIso(log.date)] += log.hours;
    overtimeHours += log.overtimeHours;
  }
  upsertRotaEntry({
    id: `rota_${employeeId}_${weekStart}`,
    employeeId,
    weekStart,
    days,
    overtimeHours,
    notes: logs.length ? "Synced from approved hour records" : "",
  });
}

export function upsertHourLog(log: HourLog): HourLog {
  const db = getDb();
  const index = db.hourLogs.findIndex((item) => item.id === log.id);
  const next = withHourApproval({ ...log, hours: Number(log.hours) || 0, overtimeHours: Number(log.overtimeHours) || 0 }, "pending");
  if (index === -1) db.hourLogs.unshift(next);
  else db.hourLogs[index] = next;
  save(db);
  syncRotaFromLogs(next.employeeId, next.date);
  return next;
}

export function deleteHourLog(id: string) {
  const db = getDb();
  const existing = db.hourLogs.find((log) => log.id === id);
  db.hourLogs = db.hourLogs.filter((log) => log.id !== id);
  save(db);
  if (existing) syncRotaFromLogs(existing.employeeId, existing.date);
}

export function listPayments(employeeId?: string, companyId?: string): Payment[] {
  const ids = employeeIdsFor(getDb().employees, companyId);
  return getDb()
    .payments.filter(
      (payment) => (!employeeId || payment.employeeId === employeeId) && belongsToCompany(payment.employeeId, ids),
    )
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate) || b.createdAt.localeCompare(a.createdAt));
}

export function getPayment(id: string): Payment | undefined {
  return getDb().payments.find((payment) => payment.id === id);
}

export function upsertPayment(payment: Payment): Payment {
  const db = getDb();
  const index = db.payments.findIndex((item) => item.id === payment.id);
  if (index === -1) db.payments.unshift(payment);
  else db.payments[index] = payment;
  save(db);
  return payment;
}

export function deletePayment(id: string) {
  const db = getDb();
  db.payments = db.payments.filter((payment) => payment.id !== id);
  save(db);
}

export function listCompanyPayments(companyId?: string): CompanyPayment[] {
  return getDb()
    .companyPayments.filter((item) => !companyId || item.companyId === companyId)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate) || b.createdAt.localeCompare(a.createdAt));
}

export function getCompanyPayment(id: string): CompanyPayment | undefined {
  return getDb().companyPayments.find((item) => item.id === id);
}

export function upsertCompanyPayment(payment: CompanyPayment): CompanyPayment {
  const db = getDb();
  const index = db.companyPayments.findIndex((item) => item.id === payment.id);
  if (index === -1) db.companyPayments.unshift(payment);
  else db.companyPayments[index] = payment;
  save(db);
  return payment;
}

export function deleteCompanyPayment(id: string) {
  const db = getDb();
  db.companyPayments = db.companyPayments.filter((item) => item.id !== id);
  save(db);
}

export function listCompanyFollowUps(companyId?: string): CompanyFollowUp[] {
  return getDb()
    .companyFollowUps.filter((item) => !companyId || item.companyId === companyId)
    .sort((a, b) => (a.completedAt ? 1 : 0) - (b.completedAt ? 1 : 0) || a.dueDate.localeCompare(b.dueDate));
}

export function getCompanyFollowUp(id: string): CompanyFollowUp | undefined {
  return getDb().companyFollowUps.find((item) => item.id === id);
}

export function upsertCompanyFollowUp(item: CompanyFollowUp): CompanyFollowUp {
  const db = getDb();
  const index = db.companyFollowUps.findIndex((entry) => entry.id === item.id);
  if (index === -1) db.companyFollowUps.unshift(item);
  else db.companyFollowUps[index] = item;
  save(db);
  return item;
}

export function deleteCompanyFollowUp(id: string) {
  const db = getDb();
  db.companyFollowUps = db.companyFollowUps.filter((item) => item.id !== id);
  save(db);
}

export function listFiles(employeeId?: string, companyId?: string): RecordFile[] {
  const ids = employeeIdsFor(getDb().employees, companyId);
  return getDb()
    .files.filter((file) => (!employeeId || file.employeeId === employeeId) && belongsToCompany(file.employeeId, ids))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function getFileRecord(id: string): RecordFile | undefined {
  return getDb().files.find((file) => file.id === id);
}

export function addFileRecord(file: RecordFile): RecordFile {
  const db = getDb();
  db.files.unshift(file);
  save(db);
  return file;
}

export function deleteFileRecord(id: string) {
  const db = getDb();
  const file = db.files.find((item) => item.id === id);
  if (file) {
    try {
      rmSync(path.join(FILES_DIR, file.storedName), { force: true });
    } catch {
      /* ignore */
    }
  }
  db.files = db.files.filter((item) => item.id !== id);
  save(db);
}

export function companyAddress(company: Company): string {
  return [company.addressLine1, company.addressLine2, company.city, company.postcode]
    .filter(Boolean)
    .join(", ");
}

export function hoursSummary(employeeId: string) {
  const logs = listHourLogs(employeeId);
  const hours = logs.reduce((sum, log) => sum + log.hours + log.overtimeHours, 0);
  const employee = getEmployee(employeeId);
  const rate = employee?.hourlyRate || 0;
  const overtimeRate = rate * (employee?.overtimeMultiplier || 1.5);
  const gross = logs.reduce((sum, log) => sum + log.hours * rate + log.overtimeHours * overtimeRate, 0);
  return { hours, gross, count: logs.length };
}

export function paymentSummary(employeeId: string) {
  const payments = listPayments(employeeId);
  const due = payments.filter((item) => item.status === "due").reduce((sum, item) => sum + item.amount, 0);
  const received = payments.filter((item) => item.status === "received").reduce((sum, item) => sum + item.amount, 0);
  return { due, received, count: payments.length };
}

export { sumHours };
