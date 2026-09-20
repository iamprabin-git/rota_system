"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HoursGrid } from "@/components/HoursGrid";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { addDays, formatDate, money, startOfWeek } from "@/lib/format";
import type { Employee, RotaEntry } from "@/lib/types";
import { emptyDays, sumHours } from "@/lib/uk-payroll";

export function RotaBoard({
  employees,
  initialWeek,
  initialRota,
}: {
  employees: Employee[];
  initialWeek: string;
  initialRota: RotaEntry[];
}) {
  const [weekStart, setWeekStart] = useState(initialWeek);
  const [rota, setRota] = useState<RotaEntry[]>(initialRota);
  const [saving, setSaving] = useState<string | null>(null);

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

  async function loadWeek(nextWeek: string) {
    setWeekStart(nextWeek);
    const response = await fetch(`/api/rota?weekStart=${nextWeek}`);
    setRota(await response.json());
  }

  async function save(entry: RotaEntry) {
    setSaving(entry.employeeId);
    const response = await fetch("/api/rota", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    const saved = (await response.json()) as RotaEntry;
    setRota((current) => {
      const rest = current.filter(
        (item) => !(item.employeeId === saved.employeeId && item.weekStart === saved.weekStart),
      );
      return [...rest, saved];
    });
    setSaving(null);
  }

  const totals = rows.reduce(
    (acc, row) => ({
      hours: acc.hours + row.hours + row.overtime,
      gross: acc.gross + row.gross,
    }),
    { hours: 0, gross: 0 },
  );

  return (
    <div className="space-y-5">
      <PageHeading
        icon="calendar"
        kicker="Weekly hours"
        title="Rota"
        description={`${formatDate(weekStart)} – ${formatDate(weekEnd)}. Hours × each person's hourly wage.`}
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

      <div className="space-y-4">
        {rows.map(({ employee, entry, hours, overtime, gross }) => (
          <article key={employee.id} className="card p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="serif text-2xl">
                  {employee.firstName} {employee.lastName}
                </h2>
                <p className="text-sm text-ink-soft">
                  {employee.jobTitle} · {money(employee.hourlyRate)}/h · OT {employee.overtimeMultiplier}×
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold tabular-nums">
                  {hours + overtime}h · {money(gross)} gross
                </p>
                <Link
                  className="text-seal"
                  href={`/agent/payslips/new?employeeId=${employee.id}&weekStart=${weekStart}`}
                >
                  Generate payslip
                </Link>
              </div>
            </div>
            <HoursGrid
              days={entry.days}
              onChange={(days) =>
                setRota((current) => {
                  const next = { ...entry, days, weekStart };
                  const rest = current.filter(
                    (item) => !(item.employeeId === employee.id && item.weekStart === weekStart),
                  );
                  return [...rest, next];
                })
              }
            />
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="field max-w-[10rem]">
                Overtime hours
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={overtime || ""}
                  onChange={(event) =>
                    setRota((current) => {
                      const next = { ...entry, weekStart, overtimeHours: Number(event.target.value) || 0 };
                      const rest = current.filter(
                        (item) => !(item.employeeId === employee.id && item.weekStart === weekStart),
                      );
                      return [...rest, next];
                    })
                  }
                />
              </label>
              <button
                className="btn btn-primary"
                type="button"
                disabled={saving === employee.id}
                onClick={() => save({ ...entry, weekStart })}
              >
                {saving === employee.id ? "Saving…" : "Save hours"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
