import { companyLive, isCompanyAllowed } from "./company";
import { getCompany, getEmployee, listCompanyPayments } from "./db";
import type { Company, CompanyPayment, SessionUser, User } from "./types";

export async function canAccessEmployee(user: SessionUser, employeeId: string): Promise<boolean> {
  const employee = await getEmployee(employeeId);
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

export async function companyForAccount(
  user: Pick<SessionUser, "role" | "companyId" | "employeeId"> | Pick<User, "role" | "companyId" | "employeeId">,
): Promise<Company | undefined> {
  if (user.role === "admin") return undefined;
  const companyId = user.companyId || (user.employeeId ? (await getEmployee(user.employeeId))?.companyId : null);
  return companyId ? getCompany(companyId) : undefined;
}

export async function assertCompanyAllowed(
  user: Pick<SessionUser, "role" | "companyId" | "employeeId"> | Pick<User, "role" | "companyId" | "employeeId">,
) {
  if (user.role === "admin") return { ok: true as const };
  const company = await companyForAccount(user);
  if (company && !isCompanyAllowed(company)) {
    return {
      ok: false as const,
      error: "This company is not allowed to use the system.",
      reason: "company_disallowed" as const,
    };
  }
  if (company) {
    let payments: CompanyPayment[] = [];
    try {
      payments = await listCompanyPayments(company.id);
    } catch {
      payments = [];
    }
    if (companyLive(company, payments) === "deactive") {
      const due = payments.some((item) => item.status === "due");
      return {
        ok: false as const,
        error: due
          ? "This company is deactive because payment is outstanding."
          : "This company is deactive. Ask admin to activate it after payment.",
        reason: "company_deactive" as const,
      };
    }
  }
  return { ok: true as const };
}
