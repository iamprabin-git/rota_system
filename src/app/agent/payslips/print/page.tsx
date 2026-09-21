import Link from "next/link";
import { notFound } from "next/navigation";
import { PayslipDocument } from "@/components/PayslipDocument";
import { PrintButton } from "@/components/PrintButton";
import { canAccessEmployee } from "@/lib/access";
import { requirePage } from "@/lib/auth";
import { companyBrand } from "@/lib/branding";
import { getPayslip, listPayslips } from "@/lib/db";
import type { Payslip } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AgentPayslipsPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; print?: string }>;
}) {
  const user = await requirePage("agent");
  const query = await searchParams;
  let slips: Payslip[] = [];

  if (query.id) {
    const slip = await getPayslip(query.id);
    if (!slip || !(await canAccessEmployee(user, slip.employeeId))) notFound();
    slips = [slip];
  } else {
    slips = await listPayslips(undefined, user.companyId || undefined);
  }

  const { logoSrc } = await companyBrand(user.companyId);
  const auto = query.print === "1";
  const label = slips.length === 1 ? "Print payslip" : "Print all payslips";

  return (
    <div className="space-y-5 py-6">
      <div className="no-print mx-auto flex max-w-[820px] flex-wrap items-center justify-between gap-3 px-4">
        <Link href="/agent/payslips" className="text-sm font-semibold text-ink-soft">
          ← All payslips
        </Link>
        {slips.length > 0 ? <PrintButton label={label} auto={auto} /> : null}
      </div>
      {slips.length === 0 ? (
        <p className="mx-auto max-w-[820px] px-4 text-ink-soft">No payslips to print.</p>
      ) : (
        <div className="print-stack space-y-8">
          {slips.map((slip) => (
            <PayslipDocument key={slip.id} payslip={slip} logoSrc={logoSrc} />
          ))}
        </div>
      )}
    </div>
  );
}
