import { formatDateLong, formatTimeRange, hoursLabel, money } from "@/lib/format";
import { initials } from "@/lib/profile";
import type { Company, Employee, HourLog } from "@/lib/types";

export function HoursStatementDocument({
  employee,
  company,
  logs,
  from,
  to,
  logoSrc,
}: {
  employee: Employee;
  company?: Pick<Company, "name" | "tradingName"> | null;
  logs: HourLog[];
  from: string;
  to: string;
  logoSrc?: string;
}) {
  const overtimeRate = employee.hourlyRate * employee.overtimeMultiplier;
  const regular = logs.reduce((sum, log) => sum + log.hours, 0);
  const overtime = logs.reduce((sum, log) => sum + log.overtimeHours, 0);
  const gross = logs.reduce(
    (sum, log) => sum + log.hours * employee.hourlyRate + log.overtimeHours * overtimeRate,
    0,
  );
  const brand = company?.tradingName || company?.name || "RotaSystem";
  const range =
    from && to
      ? `${formatDateLong(from)} – ${formatDateLong(to)}`
      : from
        ? `From ${formatDateLong(from)}`
        : to
          ? `Up to ${formatDateLong(to)}`
          : "All dates";

  return (
    <article className="payslip print-sheet">
      <header className="payslip-head">
        <div className="payslip-brand">
          {logoSrc ? (
            <img className="payslip-logo" src={logoSrc} alt="" />
          ) : (
            <span className="payslip-mark" aria-hidden>
              {initials(brand)}
            </span>
          )}
          <div>
            <p className="payslip-kicker">Hours statement</p>
            <h1>{brand}</h1>
            <p className="payslip-address">{range}</p>
          </div>
        </div>
        <div className="payslip-meta-head">
          <p className="payslip-doc">Timesheet</p>
          <dl>
            <div>
              <dt>Days</dt>
              <dd>{logs.length}</dd>
            </div>
            <div>
              <dt>Hours</dt>
              <dd>{hoursLabel(regular + overtime)}</dd>
            </div>
            <div>
              <dt>Rate</dt>
              <dd>{money(employee.hourlyRate)}/h</dd>
            </div>
            <div>
              <dt>Gross</dt>
              <dd>{money(gross)}</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="payslip-who">
        <div>
          <h2>Employee</h2>
          <p className="payslip-name">
            {employee.firstName} {employee.lastName}
          </p>
          <p>{employee.jobTitle || "—"}</p>
          <dl>
            <div>
              <dt>Payroll no.</dt>
              <dd>{employee.payrollNumber || "—"}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{employee.department || "—"}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h2>Summary</h2>
          <dl>
            <div>
              <dt>Regular</dt>
              <dd>{hoursLabel(regular)}</dd>
            </div>
            <div>
              <dt>Overtime</dt>
              <dd>{hoursLabel(overtime)}</dd>
            </div>
            <div>
              <dt>OT rate</dt>
              <dd>{money(overtimeRate)}/h</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="payslip-panel">
        <h2>Daily hours</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Start</th>
              <th>End</th>
              <th className="num">Hours</th>
              <th className="num">OT</th>
              <th className="num">Total hours</th>
              <th className="num">Gross</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty">
                  No approved hours in this date range
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const overnight = Boolean(log.startTime && log.endTime && log.endTime < log.startTime);
                const earned = log.hours * employee.hourlyRate + log.overtimeHours * overtimeRate;
                return (
                  <tr key={log.id}>
                    <td>
                      {formatDateLong(log.date)}
                      {formatTimeRange(log.startTime, log.endTime) ? (
                        <div className="payslip-basis">{formatTimeRange(log.startTime, log.endTime)}</div>
                      ) : null}
                    </td>
                    <td>{log.startTime || "—"}</td>
                    <td>
                      {log.endTime || "—"}
                      {overnight ? <div className="payslip-basis">Overnight</div> : null}
                    </td>
                    <td className="num">{hoursLabel(log.hours)}</td>
                    <td className="num">{log.overtimeHours ? hoursLabel(log.overtimeHours) : "—"}</td>
                    <td className="num">{hoursLabel(log.hours + log.overtimeHours)}</td>
                    <td className="num">{money(earned)}</td>
                    <td>{log.notes || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={3}>
                Total hours
              </th>
              <td className="num">{hoursLabel(regular)}</td>
              <td className="num">{hoursLabel(overtime)}</td>
              <td className="num">{hoursLabel(regular + overtime)}</td>
              <td className="num">{money(gross)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </section>
    </article>
  );
}
