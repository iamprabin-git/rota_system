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
  const employees = await listEmployees(user.companyId || undefined);
  const employee = query.employeeId ? await getEmployee(query.employeeId) : undefined;
  const scoped = employee && employee.companyId === user.companyId ? employee : undefined;
  const rotaEntries =
    query.weekStart && scoped ? await listRota(query.weekStart, user.companyId || undefined) : [];
  const rota = scoped ? rotaEntries.find((entry) => entry.employeeId === scoped.id) : undefined;

  return (
    <div className="space-y-6">
      <PageHeading description="Working hours are multiplied by the employee's hourly rate. Deductions use HMRC 2026/27 PAYE, Class 1 NI, student loan and auto-enrolment pension rates." />
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
