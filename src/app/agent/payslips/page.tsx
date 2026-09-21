import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { StatusPill } from "@/components/StatusPill";
import { requirePage } from "@/lib/auth";
import { listPayslips } from "@/lib/db";
import { formatDate, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AgentPayslipsPage() {
  const user = await requirePage("agent");
  const payslips = await listPayslips(undefined, user.companyId || undefined);
  const pending = payslips.filter((slip) => slip.status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeading
        description={pending ? `${pending} payslip${pending === 1 ? "" : "s"} waiting for approval.` : "Generate a statement, then approve it before the user can see it."}
        actions={
          <>
            {payslips.length > 0 ? (
              <Link href="/agent/payslips/print?print=1" className="btn btn-ghost">
                <Icon name="printer" size={16} />
                Print all
              </Link>
            ) : null}
            <Link href="/agent/payslips/new" className="btn btn-primary">
              <Icon name="filePlus" size={16} />
              Generate payslip
            </Link>
          </>
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
                <th>Net</th>
                <th>Status</th>
                <th className="text-right">Print</th>
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
                  <td className="tabular-nums">{slip.calculation.regularHours + slip.calculation.overtimeHours}</td>
                  <td className="tabular-nums">{money(slip.calculation.grossPay)}</td>
                  <td className="font-semibold tabular-nums">{money(slip.calculation.netPay)}</td>
                  <td>
                    <StatusPill status={slip.status} />
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/agent/payslips/print?id=${encodeURIComponent(slip.id)}&print=1`}
                      className="staff-icon-btn"
                      aria-label={`Print payslip for ${slip.snapshot.employeeName}`}
                      title="Print payslip"
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
