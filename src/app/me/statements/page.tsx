import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getEmployee, listPayslips } from "@/lib/db";
import { formatDate, hoursLabel, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MyStatementsPage() {
  const user = await getSession();
  if (!user?.employeeId) redirect("/login");
  const employee = getEmployee(user.employeeId);
  if (!employee) redirect("/login");
  const slips = listPayslips(employee.id);

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-ink-soft">Your UK payslips for hours already processed through payroll.</p>
      <div className="card overflow-hidden">
        {slips.length === 0 ? (
          <p className="p-6 text-ink-soft">No statements yet. Hours you log can be turned into a payslip by payroll.</p>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
