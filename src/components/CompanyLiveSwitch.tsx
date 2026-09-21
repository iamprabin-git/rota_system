"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COMPANY_LIVE_LABELS } from "@/lib/company";
import { money } from "@/lib/format";
import type { Company, CompanyLive } from "@/lib/types";

export function CompanyLiveSwitch({
  company,
  dueAmount = 0,
  compact = false,
}: {
  company: Company;
  dueAmount?: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const [live, setLive] = useState<CompanyLive>(dueAmount > 0 || company.live === "deactive" ? "deactive" : "active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const allowed = company.access !== "disallowed";
  const on = live === "active";

  async function toggle() {
    if (!allowed) return;
    const next: CompanyLive = on ? "deactive" : "active";
    if (next === "active" && dueAmount > 0) {
      setError("Outstanding payment must be received first.");
      return;
    }
    setSaving(true);
    setError("");
    const response = await fetch(`/api/companies/${company.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: company.name, live: next }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "Could not update company status.");
      return;
    }
    setLive(next);
    router.refresh();
  }

  if (!allowed) {
    return <p className={compact ? "text-xs text-ink-soft" : "text-sm text-ink-soft"}>Allow the company before using this switch.</p>;
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <button
        className={`live-switch ${on ? "on" : ""}`}
        type="button"
        disabled={saving}
        aria-pressed={on}
        onClick={() => void toggle()}
      >
        <span className="live-switch-track" aria-hidden>
          <span className="live-switch-knob" />
        </span>
        <span className="live-switch-label">{COMPANY_LIVE_LABELS[live]}</span>
      </button>
      {dueAmount > 0 ? (
        <p className={compact ? "text-xs text-seal" : "text-sm text-seal"}>{money(dueAmount)} due — stays deactive until received.</p>
      ) : error ? (
        <p className={compact ? "text-xs text-seal" : "text-sm text-seal"}>{error}</p>
      ) : !compact ? (
        <p className="text-sm text-ink-soft">Active companies can sign in. Deactive after unpaid invoices.</p>
      ) : null}
    </div>
  );
}
