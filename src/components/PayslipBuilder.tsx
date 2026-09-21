"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { HoursGrid } from "@/components/HoursGrid";
import { PayslipDocument } from "@/components/PayslipDocument";
import { addDays, isoDate, money, periodRange, startOfWeek } from "@/lib/format";
import { companyLogoUrl } from "@/lib/logo";
import type { Company, Employee, PayFrequency, Payslip, PayslipCalculation, PayslipInput } from "@/lib/types";
import { emptyDays, sumHours, taxPeriodFor } from "@/lib/uk-payroll";

export function PayslipBuilder({
  employees,
  initialEmployeeId,
  initialDays,
  initialOvertime,
  initialPeriod,
}: {
  employees: Employee[];
  initialEmployeeId?: string;
  initialDays?: PayslipInput["days"];
  initialOvertime?: number;
  initialPeriod?: { start: string; end: string; type: PayFrequency };
}) {
  const router = useRouter();
  const today = isoDate(new Date());
  const week = startOfWeek();
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || employees[0]?.id || "");
  const [periodType, setPeriodType] = useState<PayFrequency>(initialPeriod?.type || "weekly");
  const [periodEnd, setPeriodEnd] = useState(initialPeriod?.end || addDays(week, 6));
  const [paymentDate, setPaymentDate] = useState(today);
  const [days, setDays] = useState(initialDays || emptyDays());
  const [totalHours, setTotalHours] = useState(sumHours(initialDays || emptyDays()));
  const [overtimeHours, setOvertimeHours] = useState(initialOvertime || 0);
  const [bonus, setBonus] = useState(0);
  const [week1, setWeek1] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<{ calculation: PayslipCalculation; employee: Employee } | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  const periodStart = useMemo(() => {
    if (initialPeriod && periodType === initialPeriod.type && periodEnd === initialPeriod.end) {
      return initialPeriod.start;
    }
    return periodRange(periodType, periodEnd).start;
  }, [initialPeriod, periodEnd, periodType]);

  const input = useMemo(
    () => ({
      employeeId,
      periodType,
      periodStart,
      periodEnd,
      paymentDate,
      taxPeriod: taxPeriodFor(paymentDate, periodType),
      week1,
      days,
      totalHours,
      overtimeHours,
      bonus,
      otherPayments: [],
      otherDeductions: [],
    }),
    [bonus, days, employeeId, overtimeHours, paymentDate, periodEnd, periodStart, periodType, totalHours, week1],
  );

  useEffect(() => {
    void fetch("/api/company")
      .then((response) => response.json())
      .then(setCompany);
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      if (response.ok) setPreview(await response.json());
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [input, employeeId]);

  async function save() {
    setSaving(true);
    setError("");
    const response = await fetch("/api/payslips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "Could not generate payslip.");
      return;
    }
    router.push(`/payslips/${data.id}`);
    router.refresh();
  }

  const employee = employees.find((item) => item.id === employeeId);
  const hours = totalHours || sumHours(days);
  const draftPayslip: Payslip | null =
    preview && employee
      ? {
          id: "preview",
          createdAt: new Date().toISOString(),
          ...input,
          snapshot: {
            employeeName: `${employee.firstName} ${employee.lastName}`,
            jobTitle: employee.jobTitle,
            niNumber: employee.niNumber,
            taxCode: employee.taxCode,
            taxRegion: employee.taxRegion,
            niCategory: employee.niCategory,
            payrollNumber: employee.payrollNumber,
            paymentMethod: employee.paymentMethod,
            bankSortCode: employee.bankSortCode,
            bankAccountLast4: employee.bankAccountLast4,
            companyName: company?.tradingName || company?.name || "Payslip preview",
            companyAddress: [company?.addressLine1, company?.city, company?.postcode].filter(Boolean).join(", "),
            payeReference: company?.payeReference || "",
            companyId: company?.id,
          },
          calculation: preview.calculation,
        }
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <form
        className="card space-y-5 p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <label className="field">
          Employee
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            {employees.map((item) => (
              <option key={item.id} value={item.id}>
                {item.firstName} {item.lastName} · {money(item.hourlyRate)}/h
              </option>
            ))}
          </select>
        </label>
        {employee ? (
          <p className="rounded-xl bg-ledger-soft px-3 py-2 text-sm text-ledger">
            {employee.jobTitle} · tax {employee.taxCode} · NI cat {employee.niCategory} · overtime{" "}
            {employee.overtimeMultiplier}× = {money(employee.hourlyRate * employee.overtimeMultiplier)}
          </p>
        ) : (
          <p className="text-sm text-warn">
            Add a person first. <Link href="/agent/employees/new">Create record</Link>
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            Pay frequency
            <select value={periodType} onChange={(e) => setPeriodType(e.target.value as PayFrequency)}>
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="fourweekly">4-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label className="field">
            Period end
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </label>
          <label className="field">
            Period start
            <input type="date" value={periodStart} readOnly />
          </label>
          <label className="field">
            Payment date
            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </label>
        </div>

        <div>
          <div className="mb-2 flex items-end justify-between">
            <p className="text-sm font-semibold">Working hours</p>
            <p className="text-sm text-ink-soft">
              {hours}h × {employee ? money(employee.hourlyRate) : "rate"}
            </p>
          </div>
          <HoursGrid
            days={days}
            onChange={(next) => {
              setDays(next);
              setTotalHours(sumHours(next));
            }}
          />
          <label className="field mt-4">
            Total basic hours this period
            <input
              type="number"
              min="0"
              step="0.25"
              value={totalHours || ""}
              onChange={(e) => {
                setTotalHours(Number(e.target.value) || 0);
              }}
            />
          </label>
          <p className="mt-1 text-xs text-ink-soft">
            The weekday grid is a weekly breakdown. For monthly pay, type the period total here (for example 160).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            Overtime hours
            <input
              type="number"
              min="0"
              step="0.25"
              value={overtimeHours || ""}
              onChange={(e) => setOvertimeHours(Number(e.target.value) || 0)}
            />
          </label>
          <label className="field">
            Bonus / other taxable pay (£)
            <input
              type="number"
              min="0"
              step="0.01"
              value={bonus || ""}
              onChange={(e) => setBonus(Number(e.target.value) || 0)}
            />
          </label>
        </div>

        <label className="flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" className="h-4 w-4" checked={week1} onChange={(e) => setWeek1(e.target.checked)} />
          Force W1/M1 emergency tax (ignore previous slips this tax year)
        </label>

        {error ? <p className="rounded-xl bg-[#f8ead2] px-4 py-3 text-sm text-warn">{error}</p> : null}

        <button className="btn btn-primary w-full" disabled={saving || !employeeId} type="submit">
          {saving ? "Saving…" : "Save payslip"}
        </button>
      </form>

      <div className="min-w-0">
        {draftPayslip ? (
          <PayslipDocument payslip={draftPayslip} logoSrc={companyLogoUrl(company)} />
        ) : (
          <div className="card p-8 text-ink-soft">Enter hours to preview PAYE, NI and net pay.</div>
        )}
      </div>
    </div>
  );
}
