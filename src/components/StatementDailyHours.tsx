import type { ReactNode } from "react";
import Link from "next/link";
import { StatusPill } from "@/components/StatusPill";
import { SectionHeading } from "@/components/PageHeading";
import { formatDateLong, formatTimeRange, hoursLabel, money } from "@/lib/format";
import type { Employee, HourLog } from "@/lib/types";

export function isoDay(value?: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

export function filterLogsByDate(logs: HourLog[], from: string, to: string) {
  return logs.filter(
    (log) => log.status === "approved" && (!from || log.date >= from) && (!to || log.date <= to),
  );
}

export function StatementDateFilter({ from, to }: { from: string; to: string }) {
  return (
    <form method="get" action="/me/statements" className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
      <h2 className="serif col-span-full text-xl">Filter by date</h2>
      <label className="field">
        From
        <input type="date" name="from" defaultValue={from} />
      </label>
      <label className="field">
        To
        <input type="date" name="to" defaultValue={to} />
      </label>
      <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
        <button className="btn btn-primary" type="submit">
          Apply dates
        </button>
        {from || to ? (
          <Link href="/me/statements" className="btn btn-ghost">
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}

export function StatementDailyHours({
  employee,
  logs,
  from,
  to,
  actions,
}: {
  employee: Employee;
  logs: HourLog[];
  from: string;
  to: string;
  actions?: ReactNode;
}) {
  const overtimeRate = employee.hourlyRate * employee.overtimeMultiplier;
  const totalHours = logs.reduce((sum, log) => sum + log.hours + log.overtimeHours, 0);
  const regular = logs.reduce((sum, log) => sum + log.hours, 0);
  const overtime = logs.reduce((sum, log) => sum + log.overtimeHours, 0);
  const gross = logs.reduce(
    (sum, log) => sum + log.hours * employee.hourlyRate + log.overtimeHours * overtimeRate,
    0,
  );
  const rangeLabel = from && to ? `${formatDateLong(from)} – ${formatDateLong(to)}` : from ? `From ${formatDateLong(from)}` : to ? `Up to ${formatDateLong(to)}` : "All dates";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading
          icon="clock"
          title="Daily hours"
          description={`${rangeLabel}. Approved hours only, with start time, end time and pay.`}
        />
        {actions}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="card stat">
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">Total hours</p>
          <p className="serif mt-2 text-3xl">{hoursLabel(totalHours)}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {hoursLabel(regular)} regular · {hoursLabel(overtime)} OT
          </p>
        </article>
        <article className="card stat">
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">Days</p>
          <p className="serif mt-2 text-3xl">{logs.length}</p>
          <p className="mt-1 text-sm text-ink-soft">{money(employee.hourlyRate)}/h · OT {employee.overtimeMultiplier}×</p>
        </article>
        <article className="card stat">
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">Gross from hours</p>
          <p className="serif mt-2 text-3xl">{money(gross)}</p>
        </article>
      </div>
      <div className="card overflow-hidden">
        {logs.length === 0 ? (
          <p className="p-6 text-ink-soft">
            {from || to
              ? "No approved hours in this date range."
              : "No approved hours yet. Payroll must approve your timesheet before it appears here."}
          </p>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Start</th>
                <th>End</th>
                <th>Hours</th>
                <th>OT</th>
                <th>Total hours</th>
                <th>Gross</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const overnight = Boolean(log.startTime && log.endTime && log.endTime < log.startTime);
                const earned = log.hours * employee.hourlyRate + log.overtimeHours * overtimeRate;
                return (
                  <tr key={log.id}>
                    <td>
                      <p className="font-semibold">{formatDateLong(log.date)}</p>
                      {formatTimeRange(log.startTime, log.endTime) ? (
                        <p className="text-xs text-ink-soft">{formatTimeRange(log.startTime, log.endTime)}</p>
                      ) : null}
                    </td>
                    <td className="tabular-nums">{log.startTime || "—"}</td>
                    <td className="tabular-nums">
                      {log.endTime || "—"}
                      {overnight ? <p className="text-xs text-ink-soft">Overnight</p> : null}
                    </td>
                    <td className="tabular-nums">{hoursLabel(log.hours)}</td>
                    <td className="tabular-nums">{log.overtimeHours ? hoursLabel(log.overtimeHours) : "—"}</td>
                    <td className="tabular-nums font-semibold">{hoursLabel(log.hours + log.overtimeHours)}</td>
                    <td className="tabular-nums">{money(earned)}</td>
                    <td>
                      <StatusPill status={log.status} />
                      {log.reviewNote ? <p className="mt-1 text-xs text-ink-soft">{log.reviewNote}</p> : null}
                    </td>
                    <td>{log.notes || "—"}</td>
                  </tr>
                );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={3}>
                    Total hours
                  </th>
                  <td className="tabular-nums">{hoursLabel(regular)}</td>
                  <td className="tabular-nums">{hoursLabel(overtime)}</td>
                  <td className="tabular-nums">{hoursLabel(totalHours)}</td>
                  <td className="tabular-nums">{money(gross)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
        )}
      </div>
    </section>
  );
}
