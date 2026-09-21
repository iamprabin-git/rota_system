import { formatDate, hoursLabel, money, niNumberDisplay } from "@/lib/format";
import { initials } from "@/lib/profile";
import type { Payslip, PayslipLine } from "@/lib/types";
import { PERIODS } from "@/lib/uk-payroll";

function LineTable({
  title,
  lines,
  showRates,
  totalLabel,
  total,
}: {
  title: string;
  lines: PayslipLine[];
  showRates?: boolean;
  totalLabel?: string;
  total?: number;
}) {
  return (
    <section className="payslip-panel">
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            {showRates ? <th className="num">Hours</th> : null}
            {showRates ? <th className="num">Rate</th> : null}
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={showRates ? 4 : 2} className="empty">
                None this period
              </td>
            </tr>
          ) : (
            lines.map((line) => (
              <tr key={`${line.section}-${line.label}-${line.amount}`}>
                <td>{line.label}</td>
                {showRates ? <td className="num">{line.hours ? hoursLabel(line.hours) : "—"}</td> : null}
                {showRates ? <td className="num">{line.rate ? money(line.rate) : "—"}</td> : null}
                <td className="num">{money(line.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
        {totalLabel && total !== undefined ? (
          <tfoot>
            <tr>
              <th scope="row">{totalLabel}</th>
              {showRates ? <td /> : null}
              {showRates ? <td /> : null}
              <td className="num">{money(total)}</td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </section>
  );
}

export function PayslipDocument({ payslip, logoSrc }: { payslip: Payslip; logoSrc?: string }) {
  const { snapshot: snap, calculation: calc } = payslip;
  const payments = calc.lines.filter((line) => line.section === "payment");
  const deductions = calc.lines.filter((line) => line.section === "deduction");
  const employer = calc.lines.filter((line) => line.section === "employer");
  const payMethod = snap.paymentMethod === "bacs" ? "BACS" : snap.paymentMethod === "cheque" ? "Cheque" : "Cash";
  const reference = payslip.id.replace(/^ps_/, "").slice(0, 10).toUpperCase();

  return (
    <article className="payslip print-sheet">
      <header className="payslip-head">
        <div className="payslip-brand">
          {logoSrc ? (
            <img className="payslip-logo" src={logoSrc} alt="" />
          ) : (
            <span className="payslip-mark" aria-hidden>
              {initials(snap.companyName)}
            </span>
          )}
          <div>
            <p className="payslip-kicker">Itemised pay statement</p>
            <h1>{snap.companyName}</h1>
            <p className="payslip-address">{snap.companyAddress}</p>
          </div>
        </div>
        <div className="payslip-meta-head">
          <p className="payslip-doc">Payslip</p>
          <dl>
            <div>
              <dt>Tax year</dt>
              <dd>{calc.taxYear}</dd>
            </div>
            <div>
              <dt>{PERIODS[payslip.periodType].label}</dt>
              <dd>Period {calc.taxPeriod}</dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd>{reference}</dd>
            </div>
            <div>
              <dt>PAYE</dt>
              <dd>{snap.payeReference || "—"}</dd>
            </div>
          </dl>
          <p className="payslip-basis">{calc.method === "week1" ? "W1/M1 non-cumulative" : "Cumulative PAYE"}</p>
        </div>
      </header>

      <section className="payslip-who">
        <div>
          <h2>Employee</h2>
          <p className="payslip-name">{snap.employeeName}</p>
          <p>{snap.jobTitle || "—"}</p>
          <dl>
            <div>
              <dt>Payroll no.</dt>
              <dd>{snap.payrollNumber || "—"}</dd>
            </div>
            <div>
              <dt>NI number</dt>
              <dd>{niNumberDisplay(snap.niNumber)}</dd>
            </div>
            <div>
              <dt>Tax code</dt>
              <dd>
                {snap.taxCode || "—"}
                {snap.taxRegion ? ` · ${snap.taxRegion.toUpperCase()}` : ""}
              </dd>
            </div>
            <div>
              <dt>NI category</dt>
              <dd>{snap.niCategory || "—"}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h2>This period</h2>
          <p className="payslip-name">
            {formatDate(payslip.periodStart)} – {formatDate(payslip.periodEnd)}
          </p>
          <p>Payment date {formatDate(payslip.paymentDate)}</p>
          <dl>
            <div>
              <dt>Hours worked</dt>
              <dd>{hoursLabel(calc.regularHours + calc.overtimeHours)}</dd>
            </div>
            <div>
              <dt>Hourly rate</dt>
              <dd>{money(calc.hourlyRate)}</dd>
            </div>
            <div>
              <dt>Taxable pay</dt>
              <dd>{money(calc.taxablePay)}</dd>
            </div>
            <div>
              <dt>Take-home / hour</dt>
              <dd>{calc.takeHomeHourly ? money(calc.takeHomeHourly) : "—"}</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="payslip-cols">
        <LineTable title="Payments" lines={payments} showRates totalLabel="Gross pay" total={calc.grossPay} />
        <LineTable title="Deductions" lines={deductions} totalLabel="Total deductions" total={calc.totalDeductions} />
      </div>

      <section className="payslip-net">
        <div>
          <p className="payslip-kicker">Net pay this period</p>
          <p className="payslip-net-value">{money(calc.netPay)}</p>
        </div>
        <div className="payslip-pay-to">
          <p>
            Paid by {payMethod}
            {snap.bankAccountLast4 ? ` to account •••• ${snap.bankAccountLast4}` : ""}
          </p>
          {snap.bankSortCode ? <p>Sort code {snap.bankSortCode}</p> : null}
        </div>
      </section>

      <div className="payslip-cols">
        <section className="payslip-panel">
          <h2>Year to date</h2>
          <table>
            <tbody>
              {(
                [
                  ["Gross pay", calc.ytd.gross],
                  ["PAYE tax", calc.ytd.tax],
                  ["National Insurance", calc.ytd.ni],
                  ["Pension", calc.ytd.pension],
                  ["Student loans", calc.ytd.studentLoan],
                  ["Net pay", calc.ytd.net],
                ] as const
              ).map(([label, value]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td className="num">{money(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <LineTable title="Employer contributions" lines={employer} />
      </div>

      {calc.nlwWarning ? <p className="payslip-warn">{calc.nlwWarning}</p> : null}

      <footer className="payslip-foot">
        <p>
          Issued under the Employment Rights Act 1996. Figures use HMRC 2026/27 rates (6 April 2026 – 5 April 2027):
          personal allowance £12,570, employee NI 8%/2%, employer NI 15%, student loan thresholds, and auto-enrolment
          qualifying earnings £6,240–£50,270. Pension is deducted under a net pay arrangement. This is an indicative
          generator, not HMRC-recognised payroll software.
        </p>
      </footer>
    </article>
  );
}
