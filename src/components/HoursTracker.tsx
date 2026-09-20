"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDate, hoursLabel, money } from "@/lib/format";
import type { Employee, HourLog } from "@/lib/types";

export function HoursTracker({ employee, logs }: { employee: Employee; logs: HourLog[] }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [hours, setHours] = useState(8);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const totalHours = logs.reduce((sum, log) => sum + log.hours + log.overtimeHours, 0);
  const overtimeRate = employee.hourlyRate * employee.overtimeMultiplier;
  const gross = logs.reduce(
    (sum, log) => sum + log.hours * employee.hourlyRate + log.overtimeHours * overtimeRate,
    0,
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, hours, overtimeHours, notes, employeeId: employee.id }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "Could not save hours.");
      return;
    }
    setNotes("");
    setOvertimeHours(0);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this hour record?")) return;
    await fetch(`/api/hours?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form onSubmit={onSubmit} className="card space-y-4 p-5 sm:p-6">
        <h2 className="serif text-2xl">Log hours worked</h2>
        <p className="text-sm text-ink-soft">
          {money(employee.hourlyRate)}/h · overtime {employee.overtimeMultiplier}× = {money(overtimeRate)}
        </p>
        <label className="field">
          Date
          <input type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="field">
            Basic hours
            <input
              type="number"
              min="0"
              step="0.25"
              value={hours}
              onChange={(event) => setHours(Number(event.target.value) || 0)}
            />
          </label>
          <label className="field">
            Overtime hours
            <input
              type="number"
              min="0"
              step="0.25"
              value={overtimeHours || ""}
              onChange={(event) => setOvertimeHours(Number(event.target.value) || 0)}
            />
          </label>
        </div>
        <label className="field">
          Notes
          <input value={notes} placeholder="Shift, site, or job" onChange={(event) => setNotes(event.target.value)} />
        </label>
        {error ? <p className="rounded-xl bg-[#f8ead2] px-4 py-3 text-sm text-warn">{error}</p> : null}
        <button className="btn btn-primary w-full" disabled={saving} type="submit">
          {saving ? "Saving…" : "Save hours"}
        </button>
      </form>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <article className="card stat">
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">Hours tracked</p>
            <p className="serif mt-2 text-3xl">{hoursLabel(totalHours)}</p>
          </article>
          <article className="card stat">
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">Gross from hours</p>
            <p className="serif mt-2 text-3xl">{money(gross)}</p>
          </article>
        </div>
        <article className="card overflow-hidden">
          {logs.length === 0 ? (
            <p className="p-5 text-ink-soft">Your hour history will appear here.</p>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>OT</th>
                  <th>Gross</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const earned = log.hours * employee.hourlyRate + log.overtimeHours * overtimeRate;
                  return (
                    <tr key={log.id}>
                      <td>
                        {formatDate(log.date)}
                        {log.notes ? <p className="text-xs text-ink-soft">{log.notes}</p> : null}
                      </td>
                      <td className="tabular-nums">{log.hours}</td>
                      <td className="tabular-nums">{log.overtimeHours || "—"}</td>
                      <td className="tabular-nums">{money(earned)}</td>
                      <td>
                        <button className="text-sm text-seal" type="button" onClick={() => remove(log.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </article>
      </div>
    </div>
  );
}
