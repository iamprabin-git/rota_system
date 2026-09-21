"use client";

import { usePathname } from "next/navigation";
import { PanelShell } from "@/components/PanelShell";
import { money } from "@/lib/format";
import type { StaffNotice } from "@/lib/notifications";
import type { Employee, SessionUser } from "@/lib/types";

export function AppShell({
  children,
  user,
  companyName,
  employee,
  notifications = [],
}: {
  children: React.ReactNode;
  user: SessionUser | null;
  companyName?: string;
  employee?: Employee | null;
  notifications?: StaffNotice[];
}) {
  const pathname = usePathname();
  const login = pathname === "/login";
  const printing = pathname.startsWith("/payslips/") && pathname !== "/payslips/new" && !pathname.startsWith("/agent/payslips");

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
      subtitle={subtitle}
      meta={meta}
      notifications={user.role === "user" ? notifications : []}
    >
      {children}
    </PanelShell>
  );
}
