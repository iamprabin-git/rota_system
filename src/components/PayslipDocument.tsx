import { formatDate, hoursLabel, money, niNumberDisplay } from "@/lib/format";
import type { Payslip } from "@/lib/types";
import { PERIODS } from "@/lib/uk-payroll";

function Row({
  label,
  hours,
  rate,
  amount,
  muted = false,
}: {
  label: string;
  hours?: number;
  rate?: number;
  amount: number;
  muted?: boolean;
}) {
  return (
    <tr className={muted ? "text-ink-soft" : ""}>
      <td className="py-1.5 pr-3">{label}</td>
      <td className="py-1.5 pr-3 text-right tabular-nums">{hours ? hoursLabel(hours) : ""}</td>
      <td className="py-1.5 pr-3 text-right tabular-nums">{rate ? money(rate) : ""}</td>
      <td className="py-1.5 text-right tabular-nums">{money(amount)}</td>
    </tr>
  );
}

export function PayslipDocument({ payslip }: { payslip: Payslip }) {
  const { snapshot: snap, calculation: calc } = payslip;
  const payments = calc.lines.filter((line) => line.section === "payment");
  const deductions = calc.lines.filter((line) => line.section === "deduction");
  const employer = calc.lines.filter((line) => line.section === "employer");

  return (
    <article className="print-sheet mx-auto w-full max-w-[820px] overflow-hidden rounded-[1.4rem] border border-rule bg-card text-ink shadow-[0_24px_60px_-36px_rgba(27,36,51,0.55)]">
      <div className="flex items-start justify-between gap-6 border-b border-rule bg-[linear-gradient(180deg,#f8f1e4,transparent)] px-8 py-6">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-brass">Itemised pay statement</p>
          <h1 className="serif mt-1 text-3xl leading-none">{snap.companyName}</h1>
          <p className="mt-2 max-w-sm text-sm text-ink-soft">{snap.companyAddress}</p>
          <p className="mt-2 text-xs text-ink-soft">PAYE ref {snap.payeReference || "—"}</p>
        </div>
        <div className="text-right">
          <p className="serif text-2xl">Payslip</p>
          <p className="mt-1 text-sm text-ink-soft">Tax year {calc.taxYear}</p>
          <p className="text-sm text-ink-soft">
            {PERIODS[payslip.periodType].label} period {calc.taxPeriod}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-brass">
            {calc.method === "week1" ? "W1/M1 non-cumulative" : "Cumulative PAYE"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-4">
        {[
          ["Employee", snap.employeeName],
          ["Payroll no.", snap.payrollNumber],
          ["NI number", niNumberDisplay(snap.niNumber)],
          ["Tax code", snap.taxCode],
          ["Job title", snap.jobTitle],
          ["NI category", snap.niCategory],
          ["Pay period", `${formatDate(payslip.periodStart)} – ${formatDate(payslip.periodEnd)}`],
          ["Payment date", formatDate(payslip.paymentDate)],
        ].map(([label, value]) => (
          <div key={label} className="bg-card px-5 py-3">
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-ink-soft">{label}</p>
            <p className="mt-0.5 text-sm font-semibold">{value || "—"}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-px bg-rule md:grid-cols-2">
        <section className="bg-card px-8 py-5">
          <h2 className="text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">Payments</h2>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td className="py-2 text-ink-soft">No payments</td>
                </tr>
              ) : (
                payments.map((line) => (
                  <Row
                    key={`${line.label}-${line.amount}`}
                    label={line.label}
                    hours={line.hours}
                    rate={line.rate}
                    amount={line.amount}
                  />
                ))
              )}
              <tr className="border-t border-rule font-semibold">
                <td className="pt-3">Gross pay</td>
                <td />
                <td />
                <td className="pt-3 text-right tabular-nums">{money(calc.grossPay)}</td>
              </tr>
            </tbody>
          </table>
        </section>
        <section className="bg-card px-8 py-5">
          <h2 className="text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">Deductions</h2>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {deductions.length === 0 ? (
                <tr>
                  <td className="py-2 text-ink-soft">No deductions this period</td>
                </tr>
              ) : (
                deductions.map((line) => (
                  <Row key={`${line.label}-${line.amount}`} label={line.label} amount={line.amount} />
                ))
              )}
              <tr className="border-t border-rule font-semibold">
                <td className="pt-3">Total deductions</td>
                <td />
                <td />
                <td className="pt-3 text-right tabular-nums">{money(calc.totalDeductions)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6 border-y border-rule bg-[#f8f4ea] px-8 py-6">
        <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-ink-soft">Hours</p>
            <p className="font-semibold tabular-nums">
              {hoursLabel(calc.regularHours + calc.overtimeHours)}
            </p>
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-ink-soft">Hourly rate</p>
            <p className="font-semibold tabular-nums">{money(calc.hourlyRate)}</p>
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-ink-soft">Taxable pay</p>
            <p className="font-semibold tabular-nums">{money(calc.taxablePay)}</p>
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-ink-soft">Take-home / hour</p>
            <p className="font-semibold tabular-nums">
              {calc.takeHomeHourly ? money(calc.takeHomeHourly) : "—"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[0.7rem] uppercase tracking-[0.18em] text-ledger">Net pay</p>
          <p className="serif text-4xl leading-none text-ledger">{money(calc.netPay)}</p>
          <p className="mt-2 text-xs text-ink-soft">
            Paid by {snap.paymentMethod.toUpperCase()}
            {snap.bankAccountLast4 ? ` · account •••• ${snap.bankAccountLast4}` : ""}
            {snap.bankSortCode ? ` · sort ${snap.bankSortCode}` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-px bg-rule md:grid-cols-2">
        <section className="bg-card px-8 py-5">
          <h2 className="text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">Year to date</h2>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {[
              ["Gross", calc.ytd.gross],
              ["PAYE tax", calc.ytd.tax],
              ["National Insurance", calc.ytd.ni],
              ["Pension", calc.ytd.pension],
              ["Student loans", calc.ytd.studentLoan],
              ["Net pay", calc.ytd.net],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between gap-4 border-b border-dashed border-rule py-1">
                <dt className="text-ink-soft">{label}</dt>
                <dd className="tabular-nums font-medium">{money(Number(value))}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="bg-card px-8 py-5">
          <h2 className="text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">Employer contributions</h2>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {employer.map((line) => (
                <Row key={line.label} label={line.label} amount={line.amount} muted />
              ))}
              {employer.length === 0 && (
                <tr>
                  <td className="py-2 text-ink-soft">None this period</td>
                </tr>
              )}
            </tbody>
          </table>
          {calc.nlwWarning ? (
            <p className="mt-4 rounded-xl bg-[#f8ead2] px-3 py-2 text-xs text-warn">{calc.nlwWarning}</p>
          ) : null}
        </section>
      </div>

      <p className="px-8 py-4 text-[0.7rem] leading-5 text-ink-soft">
        Calculated with HMRC 2026/27 rates (6 April 2026 – 5 April 2027): personal allowance £12,570,
        employee NI 8%/2%, employer NI 15%, student loan thresholds, and auto-enrolment qualifying
        earnings £6,240–£50,270. Pension is deducted under a net pay arrangement. This is an
        indicative generator, not HMRC-recognised payroll software.
      </p>
    </article>
  );
}
