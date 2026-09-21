import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { getSession } from "@/lib/auth";
import { getEmployee, listPayslips } from "@/lib/db";
import { formatDate, hoursLabel, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MyStatementsPage() {
  const user = await getSession();
  if (!user?.employeeId) redirect("/login");
  const employee = await getEmployee(user.employeeId);
  if (!employee) redirect("/login");
  const slips = (await listPayslips(employee.id)).filter((slip) => slip.status === "approved");

  return (
    <div className="space-y-6">
      <PageHeading
        description="Approved UK payslips you can open and print. Pending drafts stay with payroll until they are published."
        actions={
          slips.length > 0 ? (
            <Link href="/me/statements/print?print=1" className="btn btn-ghost">
              <Icon name="printer" size={16} />
              Print all
            </Link>
          ) : null
        }
      />
      <div className="card overflow-hidden">
        {slips.length === 0 ? (
          <p className="p-6 text-ink-soft">No approved statements yet. Payroll will publish them here after they approve a payslip.</p>
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
                      href={`/me/statements/print?id=${encodeURIComponent(slip.id)}&print=1`}
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
          </table>
        )}
      </div>
    </div>
  );
}
