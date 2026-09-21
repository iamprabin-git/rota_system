import * as file from "@/lib/db-file";
import * as pg from "@/lib/db-pg";
import { isPostgresConfigured } from "@/lib/sql";
import { usingBlob } from "@/lib/storage";
import { sumHours } from "@/lib/uk-payroll";
import type {
  Company,
  Employee,
  HourLog,
  Payment,
  Payslip,
  RecordFile,
  RotaEntry,
  User,
} from "@/lib/types";

export {
  AVATARS_DIR,
  blankCompany,
  companyAddress,
  COMPANY_HV,
  COMPANY_RS,
  DATA_DIR,
  FILES_DIR,
} from "@/lib/db-file";

export { sumHours };
export { usingBlob };

export function usingVercelDb() {
  return isPostgresConfigured();
}

export function storageLabel() {
  if (isPostgresConfigured()) return "Vercel Postgres";
  return "Local file (set DATABASE_URL for Vercel Postgres)";
}

export async function listCompanies() {
  return isPostgresConfigured() ? pg.listCompanies() : file.listCompanies();
}

export async function getCompany(id?: string | null) {
  return isPostgresConfigured() ? pg.getCompany(id) : file.getCompany(id);
}

export async function upsertCompany(company: Company) {
  return isPostgresConfigured() ? pg.upsertCompany(company) : file.upsertCompany(company);
}

export async function saveCompany(company: Company) {
  return upsertCompany(company);
}

export async function deleteCompany(id: string) {
  return isPostgresConfigured() ? pg.deleteCompany(id) : file.deleteCompany(id);
}

export async function listEmployees(companyId?: string) {
  return isPostgresConfigured() ? pg.listEmployees(companyId) : file.listEmployees(companyId);
}

export async function getEmployee(id: string) {
  return isPostgresConfigured() ? pg.getEmployee(id) : file.getEmployee(id);
}

export async function upsertEmployee(employee: Employee) {
  return isPostgresConfigured() ? pg.upsertEmployee(employee) : file.upsertEmployee(employee);
}

export async function deleteEmployee(id: string) {
  return isPostgresConfigured() ? pg.deleteEmployee(id) : file.deleteEmployee(id);
}

export async function listUsers(companyId?: string) {
  return isPostgresConfigured() ? pg.listUsers(companyId) : file.listUsers(companyId);
}

export async function listAgents(companyId?: string) {
  return isPostgresConfigured() ? pg.listAgents(companyId) : file.listAgents(companyId);
}

export async function getUser(id: string) {
  return isPostgresConfigured() ? pg.getUser(id) : file.getUser(id);
}

export async function getUserByEmail(email: string) {
  return isPostgresConfigured() ? pg.getUserByEmail(email) : file.getUserByEmail(email);
}

export async function upsertUser(user: User) {
  return isPostgresConfigured() ? pg.upsertUser(user) : file.upsertUser(user);
}

export async function deleteUser(id: string) {
  return isPostgresConfigured() ? pg.deleteUser(id) : file.deleteUser(id);
}

export async function setStaffLogin(employee: Employee, password?: string) {
  return isPostgresConfigured() ? pg.setStaffLogin(employee, password) : file.setStaffLogin(employee, password);
}

export async function listPayslips(employeeId?: string, companyId?: string) {
  return isPostgresConfigured() ? pg.listPayslips(employeeId, companyId) : file.listPayslips(employeeId, companyId);
}

export async function getPayslip(id: string) {
  return isPostgresConfigured() ? pg.getPayslip(id) : file.getPayslip(id);
}

export async function addPayslip(payslip: Payslip) {
  return isPostgresConfigured() ? pg.addPayslip(payslip) : file.addPayslip(payslip);
}

export async function deletePayslip(id: string) {
  return isPostgresConfigured() ? pg.deletePayslip(id) : file.deletePayslip(id);
}

export async function listRota(weekStart?: string, companyId?: string) {
  return isPostgresConfigured() ? pg.listRota(weekStart, companyId) : file.listRota(weekStart, companyId);
}

export async function upsertRotaEntry(entry: RotaEntry) {
  return isPostgresConfigured() ? pg.upsertRotaEntry(entry) : file.upsertRotaEntry(entry);
}

export async function listHourLogs(employeeId?: string, companyId?: string) {
  return isPostgresConfigured() ? pg.listHourLogs(employeeId, companyId) : file.listHourLogs(employeeId, companyId);
}

export async function getHourLog(id: string) {
  return isPostgresConfigured() ? pg.getHourLog(id) : file.getHourLog(id);
}

export async function upsertHourLog(log: HourLog) {
  return isPostgresConfigured() ? pg.upsertHourLog(log) : file.upsertHourLog(log);
}

export async function deleteHourLog(id: string) {
  return isPostgresConfigured() ? pg.deleteHourLog(id) : file.deleteHourLog(id);
}

export async function listPayments(employeeId?: string, companyId?: string) {
  return isPostgresConfigured() ? pg.listPayments(employeeId, companyId) : file.listPayments(employeeId, companyId);
}

export async function getPayment(id: string) {
  return isPostgresConfigured() ? pg.getPayment(id) : file.getPayment(id);
}

export async function upsertPayment(payment: Payment) {
  return isPostgresConfigured() ? pg.upsertPayment(payment) : file.upsertPayment(payment);
}

export async function deletePayment(id: string) {
  return isPostgresConfigured() ? pg.deletePayment(id) : file.deletePayment(id);
}

export async function listFiles(employeeId?: string, companyId?: string) {
  return isPostgresConfigured() ? pg.listFiles(employeeId, companyId) : file.listFiles(employeeId, companyId);
}

export async function getFileRecord(id: string) {
  return isPostgresConfigured() ? pg.getFileRecord(id) : file.getFileRecord(id);
}

export async function addFileRecord(fileRecord: RecordFile) {
  return isPostgresConfigured() ? pg.addFileRecord(fileRecord) : file.addFileRecord(fileRecord);
}

export async function deleteFileRecord(id: string) {
  return isPostgresConfigured() ? pg.deleteFileRecord(id) : file.deleteFileRecord(id);
}

export async function hoursSummary(employeeId: string) {
  return isPostgresConfigured() ? pg.hoursSummary(employeeId) : file.hoursSummary(employeeId);
}

export async function paymentSummary(employeeId: string) {
  return isPostgresConfigured() ? pg.paymentSummary(employeeId) : file.paymentSummary(employeeId);
}
