"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyMark } from "@/components/CompanyMark";
import { Icon } from "@/components/Icon";
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
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(company);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [error, setError] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentPassword, setAgentPassword] = useState("");
  const canLogo = Boolean(form.id);
  const creating = method === "POST";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        creating
          ? { ...form, agentName, agentEmail, agentPassword }
          : form,
      ),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "Could not save company.");
      return;
    }
    setForm((current) => ({ ...current, ...data }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
    if (redirectTo) {
      router.push(data.id ? `${redirectTo}/${data.id}` : redirectTo);
      router.refresh();
    } else {
      router.refresh();
    }
  }

  async function uploadLogo(file: File) {
    setLogoBusy(true);
    setError("");
    const payload = new FormData();
    payload.set("logo", file);
    payload.set("companyId", form.id);
    const response = await fetch("/api/company/logo", { method: "POST", body: payload });
    const data = await response.json();
    setLogoBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not update logo.");
      return;
    }
    setForm((current) => ({ ...current, logo: data.logo }));
    router.refresh();
  }

  async function removeLogo() {
    setLogoBusy(true);
    setError("");
    const response = await fetch(`/api/company/logo?companyId=${encodeURIComponent(form.id)}`, { method: "DELETE" });
    const data = await response.json();
    setLogoBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not remove logo.");
      return;
    }
    setForm((current) => ({ ...current, logo: "" }));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
      {error ? <p className="rounded-xl bg-[#f8ead2] px-4 py-3 text-sm text-warn sm:col-span-2">{error}</p> : null}
      {canLogo ? (
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold">Company logo</p>
          <p className="mt-1 text-sm text-ink-soft">Used automatically on payslips, printed statements, and the header for this company’s agents and staff.</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <CompanyMark name={form.tradingName || form.name || "Company"} logo={form.logo} companyId={form.id} />
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" type="button" disabled={logoBusy} onClick={() => fileInput.current?.click()}>
                <Icon name="camera" size={16} />
                {logoBusy ? "Updating…" : form.logo ? "Replace logo" : "Upload logo"}
              </button>
              {form.logo ? (
                <button className="btn btn-ghost" type="button" disabled={logoBusy} onClick={() => void removeLogo()}>
                  Remove
                </button>
              ) : null}
            </div>
            <input
              ref={fileInput}
              className="hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void uploadLogo(file);
              }}
            />
          </div>
          <p className="mt-3 text-xs text-ink-soft">JPG, PNG or WebP · 2MB or smaller.</p>
        </div>
      ) : (
        <p className="text-sm text-ink-soft sm:col-span-2">Save the company first, then add a logo for the header.</p>
      )}
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
      {creating ? (
        <>
          <h2 className="serif col-span-full mt-2 text-xl">First agent login</h2>
          <p className="col-span-full text-sm text-ink-soft">
            This email or login ID and password open the agent panel for this company.
          </p>
          <label className="field">
            Agent name
            <input required value={agentName} onChange={(e) => setAgentName(e.target.value)} />
          </label>
          <label className="field">
            Agent login
            <input
              required
              autoComplete="off"
              value={agentEmail}
              onChange={(e) => setAgentEmail(e.target.value)}
              placeholder="agent@company.com or agent1"
            />
          </label>
          <label className="field sm:col-span-2">
            Agent password
            <input
              required
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={agentPassword}
              onChange={(e) => setAgentPassword(e.target.value)}
            />
          </label>
        </>
      ) : null}
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="btn btn-primary" disabled={saving} type="submit">
          {saving ? "Saving…" : method === "POST" ? "Create company" : "Save employer"}
        </button>
        {saved ? <span className="text-sm text-ledger">Saved</span> : null}
      </div>
    </form>
  );
}
