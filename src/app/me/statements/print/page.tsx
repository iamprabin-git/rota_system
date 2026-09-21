import Link from "next/link";
import { notFound } from "next/navigation";
import { HoursStatementDocument } from "@/components/HoursStatementDocument";
import { PayslipDocument } from "@/components/PayslipDocument";
import { PrintButton } from "@/components/PrintButton";
import { filterLogsByDate, isoDay } from "@/components/StatementDailyHours";
import { requirePage } from "@/lib/auth";
import { brandForEmployee } from "@/lib/branding";
import { getEmployee, getPayslip, listHourLogs, listPayslips } from "@/lib/db";
import type { Payslip } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MyStatementsPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; print?: string; hours?: string; from?: string; to?: string }>;
}) {
  const user = await requirePage("user");
  if (!user.employeeId) notFound();
  const employee = await getEmployee(user.employeeId);
  if (!employee) notFound();
  const query = await searchParams;
  let from = isoDay(query.from);
  let to = isoDay(query.to);
  if (from && to && from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  const hoursOnly = query.hours === "1";
  let slips: Payslip[] = [];
  const logs = hoursOnly || !query.id ? filterLogsByDate(await listHourLogs(employee.id), from, to) : [];

  if (query.id) {
    const slip = await getPayslip(query.id);
    if (!slip || slip.employeeId !== user.employeeId || slip.status !== "approved") notFound();
    slips = [slip];
  } else if (!hoursOnly) {
    slips = (await listPayslips(user.employeeId))
      .filter((slip) => slip.status === "approved")
      .filter((slip) => (!from || slip.periodEnd >= from) && (!to || slip.periodStart <= to));
  }

  const { company, logoSrc } = await brandForEmployee(user.employeeId, user.companyId);
  const auto = query.print === "1";
  const showHours = logs.length > 0 || hoursOnly;
  const canPrint = showHours || slips.length > 0;
  const back = from || to ? `/me/statements?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}` : "/me/statements";
  const label = query.id ? "Print payslip" : hoursOnly ? "Print hours" : "Print statement";

  return (
    <div className="space-y-5 py-6">
      <div className="no-print mx-auto flex max-w-[820px] flex-wrap items-center justify-between gap-3 px-4">
        <Link href={back} className="text-sm font-semibold text-ink-soft">
          ← My statements
        </Link>
        {canPrint ? <PrintButton label={label} auto={auto} /> : null}
      </div>
      {!canPrint ? (
        <p className="mx-auto max-w-[820px] px-4 text-ink-soft">Nothing to print for this date range.</p>
      ) : (
        <div className="print-stack space-y-8">
          {showHours ? (
            <HoursStatementDocument
              employee={employee}
              company={company}
              logs={logs}
              from={from}
              to={to}
              logoSrc={logoSrc}
            />
          ) : null}
          {slips.map((slip) => (
            <PayslipDocument key={slip.id} payslip={slip} logoSrc={logoSrc} />
          ))}
        </div>
      )}
    </div>
  );
}
