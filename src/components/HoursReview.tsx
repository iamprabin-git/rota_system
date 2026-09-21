"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { StatusPill } from "@/components/StatusPill";
import { formatDate, formatTimeRange, fullName, money } from "@/lib/format";
import type { ApprovalStatus, Employee, HourLog } from "@/lib/types";

export function HoursReview({ employees, logs }: { employees: Employee[]; logs: HourLog[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState(8);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const byId = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees]);
  const visible = logs.filter((log) => filter === "all" || log.status === "pending");
  const pendingCount = logs.filter((log) => log.status === "pending").length;

  async function createHours(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, date, hours, overtimeHours, notes }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "Could not save hours.");
      return;
    }
    setNotes("");
    router.refresh();
  }

  async function review(id: string, status: ApprovalStatus) {
    setBusy(id);
    await fetch("/api/hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeading
        description="Approve hours logged by users. Approved entries copy onto the weekly rota. Hours you enter here are approved immediately."
        actions={
          <button className="btn btn-ghost" type="button" onClick={() => setFilter(filter === "pending" ? "all" : "pending")}>
            {filter === "pending" ? `Show all (${logs.length})` : `Pending only (${pendingCount})`}
          </button>
        }
      />

      <form onSubmit={createHours} className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-6">
        <h2 className="serif col-span-full text-xl">Log hours for a person</h2>
        <label className="field lg:col-span-2">
          Person
          <select required value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
            <option value="">Select</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {fullName(employee)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Date
          <input type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label className="field">
          Hours
          <input type="number" min="0" step="0.25" value={hours} onChange={(event) => setHours(Number(event.target.value) || 0)} />
        </label>
        <label className="field">
          Overtime
          <input type="number" min="0" step="0.25" value={overtimeHours || ""} onChange={(event) => setOvertimeHours(Number(event.target.value) || 0)} />
        </label>
        <label className="field lg:col-span-4">
          Notes
          <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Shift or site" />
        </label>
        {error ? <p className="col-span-full text-sm text-warn">{error}</p> : null}
        <div className="col-span-full">
          <button className="btn btn-primary" disabled={saving} type="submit">
            <Icon name="check" size={16} />
            {saving ? "Saving…" : "Save approved hours"}
          </button>
        </div>
      </form>

      <div className="card overflow-hidden">
        {visible.length === 0 ? (
          <p className="p-6 text-ink-soft">{filter === "pending" ? "No hours waiting for approval." : "No hour records yet."}</p>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Person</th>
                <th>Date</th>
                <th>Hours</th>
                <th>OT</th>
                <th>Gross</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((log) => {
                const employee = byId.get(log.employeeId);
                const rate = employee?.hourlyRate || 0;
                const gross = log.hours * rate + log.overtimeHours * rate * (employee?.overtimeMultiplier || 1.5);
                return (
                  <tr key={log.id}>
                    <td>
                      <p className="font-semibold">{employee ? fullName(employee) : log.employeeId}</p>
                      {log.notes ? <p className="text-xs text-ink-soft">{log.notes}</p> : null}
                    </td>
                    <td>
                      {formatDate(log.date)}
                      {formatTimeRange(log.startTime, log.endTime) ? (
                        <p className="text-xs text-ink-soft">{formatTimeRange(log.startTime, log.endTime)}</p>
                      ) : null}
                    </td>
                    <td className="tabular-nums">{log.hours}</td>
                    <td className="tabular-nums">{log.overtimeHours || "—"}</td>
                    <td className="tabular-nums">{money(gross)}</td>
                    <td>
                      <StatusPill status={log.status} />
                    </td>
                    <td>
                      {log.status === "pending" ? (
                        <div className="flex flex-wrap gap-2">
                          <button className="btn btn-primary" type="button" disabled={busy === log.id} onClick={() => review(log.id, "approved")}>
                            Approve
                          </button>
                          <button className="btn btn-ghost" type="button" disabled={busy === log.id} onClick={() => review(log.id, "rejected")}>
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
