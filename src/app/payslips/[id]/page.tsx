import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PayslipDocument } from "@/components/PayslipDocument";
import { PayslipToolbar } from "@/components/PayslipToolbar";
import { canAccessEmployee } from "@/lib/access";
import { getSession } from "@/lib/auth";
import { getPayslip } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;
  const payslip = getPayslip(id);
  if (!payslip) notFound();
  if (!canAccessEmployee(user, payslip.employeeId)) notFound();

  return (
    <div className="space-y-5 py-6">
      <div className="no-print mx-auto flex max-w-[820px] flex-wrap items-center justify-between gap-3 px-4">
        <Link
          href={user.role === "user" ? "/me/statements" : "/agent/payslips"}
          className="text-sm font-semibold text-ink-soft"
        >
          ← {user.role === "user" ? "My statements" : "All payslips"}
        </Link>
        <PayslipToolbar id={payslip.id} canDelete={user.role === "agent"} />
      </div>
      <PayslipDocument payslip={payslip} />
    </div>
  );
}
