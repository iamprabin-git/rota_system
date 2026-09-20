import { getEmployee } from "./db";
import type { SessionUser } from "./types";

export function canAccessEmployee(user: SessionUser, employeeId: string): boolean {
  const employee = getEmployee(employeeId);
  if (!employee) return false;
  if (user.role === "user") return user.employeeId === employeeId;
  if (user.role === "agent") return employee.companyId === user.companyId;
  return false;
}

export function ownEmployeeId(user: SessionUser, requested?: string | null): string | null {
  if (user.role === "user") return user.employeeId;
  return requested || null;
}

export function scopedCompanyId(user: SessionUser): string | undefined {
  if (user.role !== "agent" || !user.companyId) return undefined;
  return user.companyId;
}
