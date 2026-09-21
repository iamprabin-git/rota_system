import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { SectionHeading } from "@/components/PageHeading";
import { getSession } from "@/lib/auth";
import {
  getEmployee,
  hoursSummary,
  listFiles,
  listHourLogs,
  listPayslips,
  paymentSummary,
} from "@/lib/db";
import { formatDate, hoursLabel, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MyRecordPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "user") redirect(user.role === "agent" ? "/agent" : "/admin");
  if (!user.employeeId) {
    return <p className="text-ink-soft">This login is not linked to a staff record.</p>;
  }
  const employee = await getEmployee(user.employeeId);
  if (!employee) redirect("/login");
  const hours = await hoursSummary(employee.id);
  const pay = await paymentSummary(employee.id);
  const recentHours = (await listHourLogs(employee.id)).slice(0, 6);
  const statements = (await listPayslips(employee.id)).slice(0, 4);
  const files = (await listFiles(employee.id)).slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-brass">Signed in as</p>
          <h2 className="serif mt-1 text-3xl">
            {employee.firstName} {employee.lastName}
          </h2>
          <p className="mt-1 text-ink-soft">
            {employee.jobTitle}
            {employee.department ? ` · ${employee.department}` : ""} · {employee.payrollNumber}
          </p>
        </div>
        <Link href="/me/hours" className="btn btn-primary">
          <Icon name="clock" size={16} />
          Record hours
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            ["clock", "Hours logged", hoursLabel(hours.hours), `${hours.count} entries`],
            ["banknote", "Earned from hours", money(hours.gross), "Hours × your wage"],
            ["wallet", "Payment due", money(pay.due), "Not yet received"],
            ["receipt", "Payment received", money(pay.received), "Marked as paid"],
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

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <SectionHeading icon="clock" title="Recent hours" />
            <Link href="/me/hours" className="text-sm font-semibold text-seal">
              All hours
            </Link>
          </div>
          {recentHours.length === 0 ? (
            <p className="px-5 pb-6 text-ink-soft">No hours recorded yet.</p>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Overtime</th>
                </tr>
              </thead>
              <tbody>
                {recentHours.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.date)}</td>
                    <td className="tabular-nums">{log.hours}</td>
                    <td className="tabular-nums">{log.overtimeHours || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
        <article className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <SectionHeading icon="fileText" title="Statements" />
            <Link href="/me/statements" className="text-sm font-semibold text-seal">
              All slips
            </Link>
          </div>
          {statements.length === 0 ? (
            <p className="px-5 pb-6 text-ink-soft">No payslip statements yet.</p>
          ) : (
            <ul className="space-y-3 px-5 pb-5">
              {statements.map((slip) => (
                <li key={slip.id} className="flex items-center justify-between gap-3 border-b border-dashed border-rule pb-3">
                  <div>
                    <Link href={`/payslips/${slip.id}`} className="font-semibold">
                      {formatDate(slip.periodStart)} – {formatDate(slip.periodEnd)}
                    </Link>
                    <p className="text-xs text-ink-soft">
                      {hoursLabel(slip.calculation.regularHours + slip.calculation.overtimeHours)}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">{money(slip.calculation.netPay)}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <article className="card p-5">
        <div className="flex items-center justify-between">
          <SectionHeading icon="folder" title="Record files" />
          <Link href="/me/files" className="text-sm font-semibold text-seal">
            Manage files
          </Link>
        </div>
        {files.length === 0 ? (
          <p className="mt-3 text-ink-soft">Keep timesheets, ID and hour-tracking documents here.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {files.map((file) => (
              <li key={file.id}>
                <a className="font-semibold" href={`/api/files/${file.id}`}>
                  {file.originalName}
                </a>
                <span className="text-ink-soft"> · {file.category}</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}
