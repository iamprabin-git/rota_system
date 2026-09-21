import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { PageHeading, SectionHeading } from "@/components/PageHeading";
import { StatementDailyHours, StatementDateFilter, filterLogsByDate, isoDay } from "@/components/StatementDailyHours";
import { getSession } from "@/lib/auth";
import { getEmployee, listHourLogs, listPayslips } from "@/lib/db";
import { formatDate, hoursLabel, money } from "@/lib/format";

export const dynamic = "force-dynamic";

function printHref(opts: { from?: string; to?: string; hours?: boolean; id?: string }) {
  const params = new URLSearchParams({ print: "1" });
  if (opts.from) params.set("from", opts.from);
  if (opts.to) params.set("to", opts.to);
  if (opts.hours) params.set("hours", "1");
  if (opts.id) params.set("id", opts.id);
  return `/me/statements/print?${params}`;
}

export default async function MyStatementsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await getSession();
  if (!user?.employeeId) redirect("/login");
  const employee = await getEmployee(user.employeeId);
  if (!employee) redirect("/login");
  const query = await searchParams;
  let from = isoDay(query.from);
  let to = isoDay(query.to);
  if (from && to && from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  const logs = filterLogsByDate(await listHourLogs(employee.id), from, to);
  const slips = (await listPayslips(employee.id))
    .filter((slip) => slip.status === "approved")
    .filter((slip) => (!from || slip.periodEnd >= from) && (!to || slip.periodStart <= to));
  const slipHours = slips.reduce(
    (sum, slip) => sum + slip.calculation.regularHours + slip.calculation.overtimeHours,
    0,
  );
  const slipGross = slips.reduce((sum, slip) => sum + slip.calculation.grossPay, 0);
  const slipTax = slips.reduce((sum, slip) => sum + slip.calculation.payeTax, 0);
  const slipNi = slips.reduce((sum, slip) => sum + slip.calculation.employeeNI, 0);
  const slipNet = slips.reduce((sum, slip) => sum + slip.calculation.netPay, 0);

  return (
    <div className="space-y-8">
      <PageHeading
        description="Approved daily hours with start and finish times, plus approved UK payslips you can open and print."
        actions={
          logs.length > 0 || slips.length > 0 ? (
            <Link href={printHref({ from, to })} className="btn btn-primary">
              <Icon name="printer" size={16} />
              Print statement
            </Link>
          ) : null
        }
      />

      <StatementDateFilter from={from} to={to} />
      <StatementDailyHours
        employee={employee}
        logs={logs}
        from={from}
        to={to}
        actions={
          logs.length > 0 ? (
            <Link href={printHref({ from, to, hours: true })} className="btn btn-ghost">
              <Icon name="printer" size={16} />
              Print hours
            </Link>
          ) : null
        }
      />

      <section className="space-y-4">
        <SectionHeading icon="fileText" title="Payslips" description="Approved statements for the same date filter." />
        <div className="card overflow-hidden">
          {slips.length === 0 ? (
            <p className="p-6 text-ink-soft">
              {from || to
                ? "No approved statements in this date range."
                : "No approved statements yet. Payroll will publish them here after they approve a payslip."}
            </p>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Hours</th>
                  <th>Gross</th>
                  <th>Tax</th>
                  <th>NI</th>
                  <th>Net</th>
                  <th className="text-right">Print</th>
                </tr>
              </thead>
              <tbody>
                {slips.map((slip) => (
                  <tr key={slip.id}>
                    <td>
                      <Link href={`/payslips/${slip.id}`} className="font-semibold">
                        {formatDate(slip.periodStart)} – {formatDate(slip.periodEnd)}
                      </Link>
                      <p className="text-xs text-ink-soft">Paid {formatDate(slip.paymentDate)}</p>
                    </td>
                    <td className="tabular-nums">
                      {hoursLabel(slip.calculation.regularHours + slip.calculation.overtimeHours)}
                    </td>
                    <td className="tabular-nums">{money(slip.calculation.grossPay)}</td>
                    <td className="tabular-nums">{money(slip.calculation.payeTax)}</td>
                    <td className="tabular-nums">{money(slip.calculation.employeeNI)}</td>
                    <td className="font-semibold tabular-nums">{money(slip.calculation.netPay)}</td>
                    <td className="text-right">
                      <Link
                        href={printHref({ id: slip.id })}
                        className="staff-icon-btn"
                        aria-label={`Print statement ${formatDate(slip.periodStart)}`}
                        title="Print statement"
                      >
                        <Icon name="printer" size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total hours</th>
                  <td className="tabular-nums">{hoursLabel(slipHours)}</td>
                  <td className="tabular-nums">{money(slipGross)}</td>
                  <td className="tabular-nums">{money(slipTax)}</td>
                  <td className="tabular-nums">{money(slipNi)}</td>
                  <td className="tabular-nums">{money(slipNet)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
