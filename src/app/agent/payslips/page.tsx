import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { requirePage } from "@/lib/auth";
import { listPayslips } from "@/lib/db";
import { formatDate, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AgentPayslipsPage() {
  const user = await requirePage("agent");
  const payslips = await listPayslips(undefined, user.companyId || undefined);

  return (
    <div className="space-y-6">
      <PageHeading
        actions={
          <Link href="/agent/payslips/new" className="btn btn-primary">
            <Icon name="filePlus" size={16} />
            Generate payslip
          </Link>
        }
      />
      <div className="card overflow-hidden">
        {payslips.length === 0 ? (
          <p className="p-6 text-ink-soft">No payslips generated yet.</p>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Paid</th>
                <th>Hours</th>
                <th>Gross</th>
                <th>Tax</th>
                <th>NI</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((slip) => (
                <tr key={slip.id}>
                  <td>
                    <Link href={`/payslips/${slip.id}`} className="font-semibold">
                      {slip.snapshot.employeeName}
                    </Link>
                    <p className="text-xs text-ink-soft">
                      {formatDate(slip.periodStart)} – {formatDate(slip.periodEnd)}
                    </p>
                  </td>
                  <td>{formatDate(slip.paymentDate)}</td>
                  <td className="tabular-nums">
                    {slip.calculation.regularHours + slip.calculation.overtimeHours}
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
