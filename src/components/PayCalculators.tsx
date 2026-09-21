"use client";

import { useMemo, useState } from "react";
import { hoursFromTimes, hoursLabel, money } from "@/lib/format";
import type { Employee, PayFrequency, PayslipCalculation } from "@/lib/types";
import { PERIODS } from "@/lib/uk-payroll";

export function PayCalculators({ employee }: { employee: Employee }) {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const worked = hoursFromTimes(startTime, endTime) ?? 0;

  const [hours, setHours] = useState(37.5);
  const [overtime, setOvertime] = useState(0);
  const regularPay = hours * employee.hourlyRate;
  const overtimePay = overtime * employee.hourlyRate * employee.overtimeMultiplier;
  const gross = regularPay + overtimePay;

  const [takeHours, setTakeHours] = useState(37.5);
  const [takeOvertime, setTakeOvertime] = useState(0);
  const [periodType, setPeriodType] = useState<PayFrequency>("weekly");
  const [result, setResult] = useState<PayslipCalculation | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const overnight = useMemo(() => {
    if (!startTime || !endTime) return false;
    return endTime < startTime;
  }, [endTime, startTime]);

  async function estimateTakeHome() {
    setWorking(true);
    setError("");
    const today = new Date().toISOString().slice(0, 10);
    const response = await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: employee.id,
        periodType,
        periodStart: today,
        periodEnd: today,
        paymentDate: today,
        totalHours: takeHours,
        overtimeHours: takeOvertime,
        days: {},
      }),
    });
    const data = await response.json();
    setWorking(false);
    if (!response.ok) {
      setError(data.error || "Could not estimate take-home pay.");
      return;
    }
    setResult(data.calculation as PayslipCalculation);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <article className="card space-y-4 p-5">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-brass">Hours</p>
          <h2 className="serif mt-1 text-2xl">Shift length</h2>
          <p className="mt-1 text-sm text-ink-soft">Start and finish times, including overnight shifts.</p>
        </div>
        <label className="field">
          <span>Start</span>
          <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
        </label>
        <label className="field">
          <span>Finish</span>
          <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
        </label>
        <p className="serif text-3xl">{hoursLabel(worked)}</p>
        {overnight ? <p className="text-sm text-ink-soft">Overnight shift — hours cross midnight.</p> : null}
      </article>

      <article className="card space-y-4 p-5">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-brass">Gross</p>
          <h2 className="serif mt-1 text-2xl">Pay before deductions</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {money(employee.hourlyRate)}/h · overtime ×{employee.overtimeMultiplier}
          </p>
        </div>
        <label className="field">
          <span>Hours</span>
          <input inputMode="decimal" value={hours || ""} onChange={(event) => setHours(Number(event.target.value) || 0)} />
        </label>
        <label className="field">
          <span>Overtime hours</span>
          <input inputMode="decimal" value={overtime || ""} onChange={(event) => setOvertime(Number(event.target.value) || 0)} />
        </label>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">Regular</dt>
            <dd className="tabular-nums">{money(regularPay)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">Overtime</dt>
            <dd className="tabular-nums">{money(overtimePay)}</dd>
          </div>
          <div className="flex justify-between gap-3 font-semibold">
            <dt>Gross</dt>
            <dd className="tabular-nums">{money(gross)}</dd>
          </div>
        </dl>
      </article>

      <article className="card space-y-4 p-5">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-brass">Take-home</p>
          <h2 className="serif mt-1 text-2xl">Estimate net pay</h2>
          <p className="mt-1 text-sm text-ink-soft">Uses your tax code, NI and pension settings. Not a published payslip.</p>
        </div>
        <label className="field">
          <span>Pay period</span>
          <select value={periodType} onChange={(event) => setPeriodType(event.target.value as PayFrequency)}>
            {(Object.keys(PERIODS) as PayFrequency[]).map((key) => (
              <option key={key} value={key}>
                {PERIODS[key].label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Hours</span>
          <input inputMode="decimal" value={takeHours || ""} onChange={(event) => setTakeHours(Number(event.target.value) || 0)} />
        </label>
        <label className="field">
          <span>Overtime hours</span>
          <input
            inputMode="decimal"
            value={takeOvertime || ""}
            onChange={(event) => setTakeOvertime(Number(event.target.value) || 0)}
          />
        </label>
        <button className="btn btn-primary" type="button" disabled={working} onClick={() => void estimateTakeHome()}>
          {working ? "Calculating…" : "Estimate take-home"}
        </button>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        {result ? (
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">Gross</dt>
              <dd className="tabular-nums">{money(result.grossPay)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">PAYE</dt>
              <dd className="tabular-nums">{money(result.payeTax)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">NI</dt>
              <dd className="tabular-nums">{money(result.employeeNI)}</dd>
            </div>
            <div className="flex justify-between gap-3 font-semibold">
              <dt>Net</dt>
              <dd className="tabular-nums">{money(result.netPay)}</dd>
            </div>
          </dl>
        ) : null}
      </article>
    </div>
  );
}
