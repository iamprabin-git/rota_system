"use client";

import { usePathname } from "next/navigation";
import { PanelShell } from "@/components/PanelShell";
import { money } from "@/lib/format";
import type { StaffNotice } from "@/lib/notice-types";
import type { Company, Employee, SessionUser } from "@/lib/types";

export function AppShell({
  children,
  user,
  company,
  employee,
  notifications = [],
}: {
  children: React.ReactNode;
  user: SessionUser | null;
  company?: Pick<Company, "id" | "name" | "tradingName" | "logo"> | null;
  employee?: Employee | null;
  notifications?: StaffNotice[];
}) {
  const companyName = company?.tradingName || company?.name;
  const pathname = usePathname();
  const login = pathname === "/login";
  const printing =
    pathname === "/agent/payslips/print" ||
    pathname === "/me/statements/print" ||
    (pathname.startsWith("/payslips/") && pathname !== "/payslips/new" && !pathname.startsWith("/agent/payslips"));

  if (login || !user || printing) {
    return <>{children}</>;
  }

  const subtitle =
    user.role === "admin"
      ? "Platform admin"
      : user.role === "agent"
        ? companyName || "Company agent"
        : employee?.jobTitle || "Staff record";

  const meta =
    user.role === "admin"
      ? "Companies · agents · access"
      : user.role === "agent"
        ? companyName || "Company payroll"
        : employee
          ? `${employee.payrollNumber} · ${money(employee.hourlyRate)}/h`
          : undefined;

  return (
    <PanelShell
      user={user}
      company={company}
      subtitle={subtitle}
      meta={meta}
      notifications={notifications}
    >
      {children}
    </PanelShell>
  );
}
