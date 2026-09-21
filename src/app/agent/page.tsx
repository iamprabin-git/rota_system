import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { PageHeading, SectionHeading } from "@/components/PageHeading";
import { requirePage } from "@/lib/auth";
import { getCompany, listEmployees, listPayslips, listRota } from "@/lib/db";
import { formatDate, fullName, money, startOfWeek } from "@/lib/format";
import { sumHours } from "@/lib/uk-payroll";

export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
  const user = await requirePage("agent");
  const company = await getCompany(user.companyId);
  const employees = await listEmployees(user.companyId || undefined);
  const payslips = await listPayslips(undefined, user.companyId || undefined);
  const weekStart = startOfWeek();
  const rota = await listRota(weekStart, user.companyId || undefined);
  const rotaHours = rota.reduce((sum, entry) => sum + sumHours(entry.days) + entry.overtimeHours, 0);
  const payrollYtd = payslips.reduce((sum, slip) => sum + slip.calculation.grossPay, 0);
  const netYtd = payslips.reduce((sum, slip) => sum + slip.calculation.netPay, 0);
  const recent = payslips.slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeading
        description={`Payroll for ${company?.tradingName || company?.name || "your company"} only. Log working hours against hourly wages, then generate UK PAYE payslips.`}
        actions={
          <>
            <Link href="/agent/rota" className="btn btn-ghost">
              <Icon name="calendar" size={16} />
              This week&apos;s rota
            </Link>
            <Link href="/agent/payslips/new" className="btn btn-primary">
              <Icon name="filePlus" size={16} />
              Generate payslip
            </Link>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["users", "People on payroll", String(employees.length), "Hourly staff records"],
            ["clock", "Hours this week", rotaHours.toLocaleString("en-GB", { maximumFractionDigits: 1 }), "From the live rota"],
            ["fileText", "Gross generated", money(payrollYtd), "All saved payslips"],
            ["banknote", "Net paid", money(netYtd), "Take-home across slips"],
          ] as const
        ).map(([icon, label, value, hint]) => (
          <article key={label} className="card stat">
            <p className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">
              <Icon name={icon as IconName} size={14} />
              {label}
            </p>
            <p className="serif mt-2 text-3xl">{value}</p>
            <p className="mt-1 text-sm text-ink-soft">{hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <SectionHeading icon="fileText" title="Recent payslips" />
            <Link href="/agent/payslips" className="text-sm font-semibold text-seal">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 pb-6 text-ink-soft">
              No payslips yet. Add hours on the rota or generate one from an hourly rate.
            </p>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Period</th>
                  <th>Hours</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((slip) => (
                  <tr key={slip.id}>
                    <td>
                      <Link href={`/payslips/${slip.id}`} className="font-semibold">
                        {slip.snapshot.employeeName}
                      </Link>
                      <p className="text-xs text-ink-soft">{slip.snapshot.jobTitle}</p>
                    </td>
                    <td className="text-sm">
                      {formatDate(slip.periodStart)} – {formatDate(slip.periodEnd)}
                    </td>
                    <td className="tabular-nums">
                      {(slip.calculation.regularHours + slip.calculation.overtimeHours).toLocaleString("en-GB")}
                    </td>
                    <td className="font-semibold tabular-nums">{money(slip.calculation.netPay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className="card p-5">
          <SectionHeading icon="users" title="Hourly rates" />
          <ul className="mt-4 space-y-3">
            {employees.map((employee) => (
              <li key={employee.id} className="flex items-center justify-between gap-3 border-b border-dashed border-rule pb-3">
                <div>
                  <Link href={`/agent/employees/${employee.id}`} className="font-semibold">
                    {fullName(employee)}
                  </Link>
                  <p className="text-xs text-ink-soft">{employee.jobTitle}</p>
                </div>
                <p className="tabular-nums font-semibold">{money(employee.hourlyRate)}/h</p>
              </li>
            ))}
          </ul>
          <Link href="/agent/employees/new" className="btn btn-ghost mt-5 w-full">
            <Icon name="userPlus" size={16} />
            Add person
          </Link>
        </article>
      </section>
    </div>
  );
}
