import { PageHeading } from "@/components/PageHeading";
import { PayslipBuilder } from "@/components/PayslipBuilder";
import { requirePage } from "@/lib/auth";
import { getEmployee, listEmployees, listRota } from "@/lib/db";
import { addDays } from "@/lib/format";
import { emptyDays } from "@/lib/uk-payroll";
import type { PayFrequency } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewAgentPayslipPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string; weekStart?: string }>;
}) {
  const user = await requirePage("agent");
  const query = await searchParams;
  const employees = listEmployees(user.companyId || undefined);
  const employee = query.employeeId ? getEmployee(query.employeeId) : undefined;
  const scoped = employee && employee.companyId === user.companyId ? employee : undefined;
  const rota =
    query.weekStart && scoped
      ? listRota(query.weekStart, user.companyId || undefined).find((entry) => entry.employeeId === scoped.id)
      : undefined;

  return (
    <div className="space-y-6">
      <PageHeading
        icon="receipt"
        kicker="Hours × hourly wage"
        title="Generate a UK payslip"
        description="Working hours are multiplied by the employee's hourly rate. Deductions use HMRC 2026/27 PAYE, Class 1 NI, student loan and auto-enrolment pension rates."
      />
      <PayslipBuilder
        employees={employees}
        initialEmployeeId={scoped?.id}
        initialDays={rota?.days || emptyDays()}
        initialOvertime={rota?.overtimeHours || 0}
        initialPeriod={
          query.weekStart
            ? { start: query.weekStart, end: addDays(query.weekStart, 6), type: "weekly" as PayFrequency }
            : undefined
        }
      />
    </div>
  );
}
