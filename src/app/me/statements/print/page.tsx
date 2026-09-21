import Link from "next/link";
import { notFound } from "next/navigation";
import { PayslipDocument } from "@/components/PayslipDocument";
import { PrintButton } from "@/components/PrintButton";
import { requirePage } from "@/lib/auth";
import { brandForEmployee } from "@/lib/branding";
import { getPayslip, listPayslips } from "@/lib/db";
import type { Payslip } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MyStatementsPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; print?: string }>;
}) {
  const user = await requirePage("user");
  if (!user.employeeId) notFound();
  const query = await searchParams;
  let slips: Payslip[] = [];

  if (query.id) {
    const slip = await getPayslip(query.id);
    if (!slip || slip.employeeId !== user.employeeId || slip.status !== "approved") notFound();
    slips = [slip];
  } else {
    slips = (await listPayslips(user.employeeId)).filter((slip) => slip.status === "approved");
  }

  const { logoSrc } = await brandForEmployee(user.employeeId, user.companyId);
  const auto = query.print === "1";
  const label = slips.length === 1 ? "Print payslip" : "Print all statements";

  return (
    <div className="space-y-5 py-6">
      <div className="no-print mx-auto flex max-w-[820px] flex-wrap items-center justify-between gap-3 px-4">
        <Link href="/me/statements" className="text-sm font-semibold text-ink-soft">
          ← My statements
        </Link>
        {slips.length > 0 ? <PrintButton label={label} auto={auto} /> : null}
      </div>
      {slips.length === 0 ? (
        <p className="mx-auto max-w-[820px] px-4 text-ink-soft">No approved statements to print.</p>
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
