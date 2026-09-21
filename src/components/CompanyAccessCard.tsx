"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CompanyLiveSwitch } from "@/components/CompanyLiveSwitch";
import { StatusPill } from "@/components/StatusPill";
import { COMPANY_ACCESS_LABELS } from "@/lib/company";
import type { Company, CompanyAccess } from "@/lib/types";

export function CompanyAccessCard({ company, dueAmount = 0 }: { company: Company; dueAmount?: number }) {
  const router = useRouter();
  const [access, setAccess] = useState<CompanyAccess>(company.access === "disallowed" ? "disallowed" : "allowed");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function toggle(next: CompanyAccess) {
    setSaving(true);
    setError("");
    const response = await fetch(`/api/companies/${company.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: company.name, access: next }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "Could not update access.");
      return;
    }
    setAccess(next);
    router.refresh();
  }

  return (
    <article className="card space-y-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-brass">Access</p>
          <h2 className="serif mt-1 text-2xl">Allow or disallow</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Disallowed companies cannot sign in as agents or users.
          </p>
        </div>
        <StatusPill status={access} kind="company" />
      </div>
      <div className="flex flex-wrap gap-2">
        {(["allowed", "disallowed"] as const).map((value) => (
          <button
            key={value}
            className={`btn ${access === value ? "btn-primary" : "btn-ghost"}`}
            type="button"
            disabled={saving || access === value}
            onClick={() => void toggle(value)}
          >
            {COMPANY_ACCESS_LABELS[value]}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-seal">{error}</p> : null}
      {access === "allowed" ? (
        <div className="border-t border-dashed border-rule pt-4">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-brass">Payment status</p>
          <h3 className="serif mt-1 text-xl">Active or deactive</h3>
          <div className="mt-3">
            <CompanyLiveSwitch company={{ ...company, access }} dueAmount={dueAmount} />
          </div>
        </div>
      ) : null}
    </article>
  );
}
