"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Employee } from "@/lib/types";
import { NLW } from "@/lib/uk-payroll";

type FormState = Omit<Employee, "id" | "createdAt">;

const empty: FormState = {
  firstName: "",
  lastName: "",
  jobTitle: "",
  department: "",
  payrollNumber: "",
  niNumber: "",
  taxCode: "1257L",
  taxRegion: "england",
  niCategory: "A",
  hourlyRate: NLW.age21,
  overtimeMultiplier: 1.5,
  startDate: new Date().toISOString().slice(0, 10),
  dateOfBirth: "",
  studentLoan: "none",
  postgraduateLoan: false,
  pensionEmployeePercent: 5,
  pensionEmployerPercent: 3,
  pensionBasis: "qualifying",
  paymentMethod: "bacs",
  bankSortCode: "",
  bankAccountLast4: "",
  email: "",
  companyId: "",
};

export function EmployeeForm({ employee }: { employee?: Employee }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [form, setForm] = useState<FormState>(
    employee
      ? {
          ...employee,
        }
      : empty,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch(employee ? `/api/employees/${employee.id}` : "/api/employees", {
      method: employee ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, password: password || undefined }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "Could not save employee.");
      return;
    }
    router.push("/agent/employees");
    router.refresh();
  }

  async function onDelete() {
    if (!employee) return;
    if (!confirm(`Remove ${employee.firstName} ${employee.lastName} and their payslips?`)) return;
    await fetch(`/api/employees/${employee.id}`, { method: "DELETE" });
    router.push("/agent/employees");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-8 p-6 sm:p-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="serif col-span-full text-xl">Personal</h2>
        <label className="field">
          First name
          <input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </label>
        <label className="field">
          Last name
          <input required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </label>
        <label className="field">
          Job title
          <input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
        </label>
        <label className="field">
          Department
          <input value={form.department} onChange={(e) => set("department", e.target.value)} />
        </label>
        <label className="field">
          Date of birth
          <input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
        </label>
        <label className="field">
          Start date
          <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </label>
        <label className="field">
          Login email
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="name@company.local"
          />
        </label>
        <p className="col-span-full text-sm text-ink-soft">
          Staff can sign in with this email. New logins stay pending until you approve them under Users.
        </p>
        <label className="field">
          {employee ? "New login password" : "Login password"}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={employee ? "Leave blank to keep current" : "Staff can sign in with this"}
          />
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="serif col-span-full text-xl">Pay</h2>
        <label className="field">
          Hourly wage (£)
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.hourlyRate}
            onChange={(e) => set("hourlyRate", Number(e.target.value))}
          />
        </label>
        <label className="field">
          Overtime multiplier
          <input
            type="number"
            min="1"
            step="0.1"
            value={form.overtimeMultiplier}
            onChange={(e) => set("overtimeMultiplier", Number(e.target.value))}
          />
        </label>
        <p className="col-span-full text-sm text-ink-soft">
          National Living Wage from April 2026 is £{NLW.age21.toFixed(2)} (age 21+). 18–20: £
          {NLW.age18to20.toFixed(2)}. Under 18 / apprentice: £{NLW.under18.toFixed(2)}.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <h2 className="serif col-span-full text-xl">HMRC</h2>
        <label className="field">
          Payroll number
          <input value={form.payrollNumber} onChange={(e) => set("payrollNumber", e.target.value)} />
        </label>
        <label className="field">
          National Insurance number
          <input value={form.niNumber} onChange={(e) => set("niNumber", e.target.value.toUpperCase())} />
        </label>
        <label className="field">
          Tax code
          <input value={form.taxCode} onChange={(e) => set("taxCode", e.target.value.toUpperCase())} />
        </label>
        <label className="field">
          Tax region
          <select value={form.taxRegion} onChange={(e) => set("taxRegion", e.target.value as FormState["taxRegion"])}>
            <option value="england">England</option>
            <option value="wales">Wales</option>
            <option value="ni">Northern Ireland</option>
            <option value="scotland">Scotland</option>
          </select>
        </label>
        <label className="field">
          NI category
          <select value={form.niCategory} onChange={(e) => set("niCategory", e.target.value as FormState["niCategory"])}>
            <option value="A">A — standard</option>
            <option value="B">B — married women reduced</option>
            <option value="C">C — over state pension age</option>
            <option value="H">H — apprentice under 25</option>
            <option value="J">J — deferment</option>
            <option value="M">M — under 21</option>
            <option value="V">V — veteran</option>
            <option value="Z">Z — under 21 deferment</option>
          </select>
        </label>
        <label className="field">
          Student loan
          <select value={form.studentLoan} onChange={(e) => set("studentLoan", e.target.value as FormState["studentLoan"])}>
            <option value="none">None</option>
            <option value="plan1">Plan 1</option>
            <option value="plan2">Plan 2</option>
            <option value="plan4">Plan 4 (Scotland)</option>
            <option value="plan5">Plan 5</option>
          </select>
        </label>
        <label className="flex items-center gap-3 pt-6 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={form.postgraduateLoan}
            onChange={(e) => set("postgraduateLoan", e.target.checked)}
          />
          Postgraduate loan
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <h2 className="serif col-span-full text-xl">Pension & payment</h2>
        <label className="field">
          Employee pension %
          <input
            type="number"
            min="0"
            step="0.1"
            value={form.pensionEmployeePercent}
            onChange={(e) => set("pensionEmployeePercent", Number(e.target.value))}
          />
        </label>
        <label className="field">
          Employer pension %
          <input
            type="number"
            min="0"
            step="0.1"
            value={form.pensionEmployerPercent}
            onChange={(e) => set("pensionEmployerPercent", Number(e.target.value))}
          />
        </label>
        <label className="field">
          Pension basis
          <select
            value={form.pensionBasis}
            onChange={(e) => set("pensionBasis", e.target.value as FormState["pensionBasis"])}
          >
            <option value="qualifying">Qualifying earnings (auto-enrolment)</option>
            <option value="pensionable">Full pensionable pay</option>
          </select>
        </label>
        <label className="field">
          Payment method
          <select
            value={form.paymentMethod}
            onChange={(e) => set("paymentMethod", e.target.value as FormState["paymentMethod"])}
          >
            <option value="bacs">BACS</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
          </select>
        </label>
        <label className="field">
          Sort code
          <input value={form.bankSortCode} onChange={(e) => set("bankSortCode", e.target.value)} />
        </label>
        <label className="field">
          Account last 4
          <input
            maxLength={4}
            value={form.bankAccountLast4}
            onChange={(e) => set("bankAccountLast4", e.target.value)}
          />
        </label>
      </section>

      {error ? <p className="rounded-xl bg-[#f8ead2] px-4 py-3 text-sm text-warn">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" disabled={saving} type="submit">
          {saving ? "Saving…" : employee ? "Save person" : "Add person"}
        </button>
        {employee ? (
          <button className="btn btn-ghost" type="button" onClick={onDelete}>
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
