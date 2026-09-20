"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Company } from "@/lib/types";

export function CompanyForm({
  company,
  endpoint = "/api/company",
  method = "PUT",
  redirectTo,
}: {
  company: Company;
  endpoint?: string;
  method?: "PUT" | "POST";
  redirectTo?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(company);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return;
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
    if (redirectTo) {
      router.push(data.id ? `${redirectTo}/${data.id}` : redirectTo);
      router.refresh();
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
      <label className="field sm:col-span-2">
        Legal name
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </label>
      <label className="field sm:col-span-2">
        Trading name on payslips
        <input value={form.tradingName} onChange={(e) => setForm({ ...form, tradingName: e.target.value })} />
      </label>
      <label className="field sm:col-span-2">
        Address line 1
        <input value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} />
      </label>
      <label className="field">
        Address line 2
        <input value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} />
      </label>
      <label className="field">
        City
        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      </label>
      <label className="field">
        Postcode
        <input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value.toUpperCase() })} />
      </label>
      <label className="field">
        PAYE reference
        <input value={form.payeReference} onChange={(e) => setForm({ ...form, payeReference: e.target.value })} />
      </label>
      <label className="field">
        Accounts office reference
        <input
          value={form.accountsOfficeRef}
          onChange={(e) => setForm({ ...form, accountsOfficeRef: e.target.value })}
        />
      </label>
      <label className="field">
        Payroll email
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </label>
      <label className="field">
        Phone
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="btn btn-primary" disabled={saving} type="submit">
          {saving ? "Saving…" : method === "POST" ? "Create company" : "Save employer"}
        </button>
        {saved ? <span className="text-sm text-ledger">Saved</span> : null}
      </div>
    </form>
  );
}
