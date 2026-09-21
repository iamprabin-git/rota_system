"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HoursGrid } from "@/components/HoursGrid";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { addDays, formatDate, money, startOfWeek } from "@/lib/format";
import type { Employee, HourLog, RotaEntry, Weekday } from "@/lib/types";
import { WEEKDAYS } from "@/lib/types";
import { emptyDays, sumHours } from "@/lib/uk-payroll";

function weekdayFromIso(iso: string): Weekday {
  const date = new Date(`${iso}T12:00:00`);
  const day = date.getDay();
  return day === 0 ? "sun" : WEEKDAYS[day - 1];
}

export function RotaBoard({
  employees,
  initialWeek,
  initialRota,
  hourLogs = [],
}: {
  employees: Employee[];
  initialWeek: string;
  initialRota: RotaEntry[];
  hourLogs?: HourLog[];
}) {
  const [weekStart, setWeekStart] = useState(initialWeek);
  const [rota, setRota] = useState<RotaEntry[]>(initialRota);
  const [saving, setSaving] = useState<string | null>(null);
  const [focusId, setFocusId] = useState(employees[0]?.id || "");

  const weekEnd = addDays(weekStart, 6);

  const rows = useMemo(
    () =>
      employees.map((employee) => {
        const entry =
          rota.find((item) => item.employeeId === employee.id && item.weekStart === weekStart) ||
          ({
            id: `rota_${employee.id}_${weekStart}`,
            employeeId: employee.id,
            weekStart,
            days: emptyDays(),
            overtimeHours: 0,
            notes: "",
          } satisfies RotaEntry);
        const hours = sumHours(entry.days);
        const overtime = entry.overtimeHours || 0;
        const gross = hours * employee.hourlyRate + overtime * employee.hourlyRate * employee.overtimeMultiplier;
        return { employee, entry, hours, overtime, gross };
      }),
    [employees, rota, weekStart],
  );

  function updateEntry(employeeId: string, patch: Partial<RotaEntry>) {
    setRota((current) => {
      const existing =
        current.find((item) => item.employeeId === employeeId && item.weekStart === weekStart) ||
        ({
          id: `rota_${employeeId}_${weekStart}`,
          employeeId,
          weekStart,
          days: emptyDays(),
          overtimeHours: 0,
          notes: "",
        } satisfies RotaEntry);
      const next = { ...existing, ...patch, employeeId, weekStart };
      return [...current.filter((item) => !(item.employeeId === employeeId && item.weekStart === weekStart)), next];
    });
  }

  async function loadWeek(nextWeek: string) {
    setWeekStart(nextWeek);
    const response = await fetch(`/api/rota?weekStart=${nextWeek}`);
    const text = await response.text();
    setRota(text ? (JSON.parse(text) as RotaEntry[]) : []);
  }

  async function save(entry: RotaEntry) {
    setSaving(entry.employeeId);
    const response = await fetch("/api/rota", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    const text = await response.text();
    const saved = text ? (JSON.parse(text) as RotaEntry) : entry;
    setRota((current) => {
      const rest = current.filter(
        (item) => !(item.employeeId === saved.employeeId && item.weekStart === saved.weekStart),
      );
      return [...rest, saved];
    });
    setSaving(null);
  }

  async function saveAll() {
    for (const row of rows) {
      if (row.hours + row.overtime > 0) await save({ ...row.entry, weekStart });
    }
  }

  function fillApproved(employeeId: string) {
    const logs = hourLogs.filter(
      (log) => log.employeeId === employeeId && log.status === "approved" && log.date >= weekStart && log.date <= weekEnd,
    );
    const days = emptyDays();
    let overtimeHours = 0;
    for (const log of logs) {
      days[weekdayFromIso(log.date)] += log.hours;
      overtimeHours += log.overtimeHours;
    }
    updateEntry(employeeId, { days, overtimeHours, notes: logs.length ? "From approved hours" : "" });
  }

  const totals = rows.reduce(
    (acc, row) => ({
      hours: acc.hours + row.hours + row.overtime,
      gross: acc.gross + row.gross,
    }),
    { hours: 0, gross: 0 },
  );

  const focused = rows.find((row) => row.employee.id === focusId) || rows[0];

  return (
    <div className="space-y-5">
      <PageHeading
        description={`${formatDate(weekStart)} – ${formatDate(weekEnd)}. Create a weekly rota for each user, then generate a payslip from it.`}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" type="button" onClick={() => loadWeek(addDays(weekStart, -7))}>
              Previous
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => loadWeek(startOfWeek())}>
              This week
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => loadWeek(addDays(weekStart, 7))}>
              Next
            </button>
            <button className="btn btn-primary" type="button" onClick={() => saveAll()}>
              Save all rotas
            </button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="card stat">
          <p className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">
            <Icon name="clock" size={14} />
            Hours scheduled
          </p>
          <p className="serif mt-2 text-3xl">{totals.hours.toLocaleString("en-GB", { maximumFractionDigits: 2 })}</p>
        </article>
        <article className="card stat">
          <p className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">
            <Icon name="banknote" size={14} />
            Gross wages (pre-tax)
          </p>
          <p className="serif mt-2 text-3xl">{money(totals.gross)}</p>
        </article>
      </div>

      {focused ? (
        <article className="card space-y-4 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="field min-w-[16rem]">
              Create rota for
              <select value={focusId} onChange={(event) => setFocusId(event.target.value)}>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} · {employee.jobTitle}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-ghost" type="button" onClick={() => fillApproved(focused.employee.id)}>
              Fill from approved hours
            </button>
          </div>
          <HoursGrid days={focused.entry.days} onChange={(days) => updateEntry(focused.employee.id, { days })} />
          <div className="flex flex-wrap items-end gap-3">
            <label className="field max-w-[10rem]">
              Overtime hours
              <input
                type="number"
                min="0"
                step="0.25"
                value={focused.overtime || ""}
                onChange={(event) => updateEntry(focused.employee.id, { overtimeHours: Number(event.target.value) || 0 })}
              />
            </label>
            <label className="field min-w-[16rem] flex-1">
              Notes for this person
              <input
                value={focused.entry.notes}
                onChange={(event) => updateEntry(focused.employee.id, { notes: event.target.value })}
                placeholder="Shift pattern, site, cover"
              />
            </label>
            <button
              className="btn btn-primary"
              type="button"
              disabled={saving === focused.employee.id}
              onClick={() => save({ ...focused.entry, weekStart })}
            >
              {saving === focused.employee.id ? "Saving…" : "Save rota"}
            </button>
            <Link className="btn btn-ghost" href={`/agent/payslips/new?employeeId=${focused.employee.id}&weekStart=${weekStart}`}>
              Generate payslip
            </Link>
          </div>
        </article>
      ) : (
        <p className="card p-6 text-ink-soft">Add people before creating a rota.</p>
      )}

      <div className="space-y-4">
        {rows.map(({ employee, entry, hours, overtime, gross }) => (
          <article key={employee.id} className="card p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <button className="text-left" type="button" onClick={() => setFocusId(employee.id)}>
                <h2 className="serif text-2xl">
                  {employee.firstName} {employee.lastName}
                </h2>
                <p className="text-sm text-ink-soft">
                  {employee.jobTitle} · {money(employee.hourlyRate)}/h · OT {employee.overtimeMultiplier}×
                </p>
              </button>
              <div className="text-right text-sm">
                <p className="font-semibold tabular-nums">
                  {hours + overtime}h · {money(gross)} gross
                </p>
                <Link className="text-seal" href={`/agent/payslips/new?employeeId=${employee.id}&weekStart=${weekStart}`}>
                  Generate payslip
                </Link>
              </div>
            </div>
            <HoursGrid days={entry.days} onChange={(days) => updateEntry(employee.id, { days })} />
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="field max-w-[10rem]">
                Overtime hours
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={overtime || ""}
                  onChange={(event) => updateEntry(employee.id, { overtimeHours: Number(event.target.value) || 0 })}
                />
              </label>
              <button
                className="btn btn-primary"
                type="button"
                disabled={saving === employee.id}
                onClick={() => save({ ...entry, weekStart })}
              >
                {saving === employee.id ? "Saving…" : "Save rota"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
