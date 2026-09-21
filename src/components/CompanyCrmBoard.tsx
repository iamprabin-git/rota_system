"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CRM_STAGE_LABELS } from "@/lib/company";
import { formatDate, isoDate } from "@/lib/format";
import type { Company, CompanyFollowUp, CrmStage } from "@/lib/types";
import { CRM_STAGES } from "@/lib/types";

export function CompanyCrmBoard({
  companies,
  followUps,
  company,
}: {
  companies: Company[];
  followUps: CompanyFollowUp[];
  company?: Company;
}) {
  const router = useRouter();
  const today = isoDate(new Date());
  const [selected, setSelected] = useState(company?.id || companies[0]?.id || "");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState(today);
  const [stage, setStage] = useState<CrmStage>(company?.crmStage || "active");
  const [crmNotes, setCrmNotes] = useState(company?.crmNotes || "");
  const [error, setError] = useState("");
  const names = Object.fromEntries(companies.map((item) => [item.id, item.tradingName || item.name]));
  const open = followUps.filter((item) => !item.completedAt);
  const done = followUps.filter((item) => item.completedAt);

  async function saveStage(event: React.FormEvent) {
    event.preventDefault();
    if (!company) return;
    setError("");
    const response = await fetch(`/api/companies/${company.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: company.name, crmStage: stage, crmNotes }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Could not save CRM details.");
      return;
    }
    router.refresh();
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/company-followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: selected, note, dueDate }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Could not save follow-up.");
      return;
    }
    setNote("");
    router.refresh();
  }

  async function complete(id: string, doneNow: boolean) {
    await fetch("/api/company-followups", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, complete: doneNow }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this follow-up?")) return;
    await fetch(`/api/company-followups?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {company ? (
        <form onSubmit={saveStage} className="card grid gap-3 p-5 sm:grid-cols-2">
          <h2 className="serif col-span-full text-2xl">CRM record</h2>
          <label className="field">
            Stage
            <select value={stage} onChange={(event) => setStage(event.target.value as CrmStage)}>
              {CRM_STAGES.map((value) => (
                <option key={value} value={value}>
                  {CRM_STAGE_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="field sm:col-span-2">
            Account notes
            <textarea rows={3} value={crmNotes} onChange={(event) => setCrmNotes(event.target.value)} />
          </label>
          <button className="btn btn-primary sm:col-span-2" type="submit">
            Save CRM
          </button>
        </form>
      ) : null}

      <form onSubmit={create} className="card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="serif col-span-full text-2xl">Schedule a follow-up</h2>
        {!company ? (
          <label className="field col-span-full">
            Company
            <select value={selected} onChange={(event) => setSelected(event.target.value)} required>
              {companies.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.tradingName || item.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="field sm:col-span-2">
          Note
          <input required value={note} onChange={(event) => setNote(event.target.value)} placeholder="Call, email, visit…" />
        </label>
        <label className="field">
          Follow-up date
          <input type="date" required value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        {error ? <p className="col-span-full text-sm text-seal">{error}</p> : null}
        <button className="btn btn-primary" type="submit">
          Add follow-up
        </button>
      </form>

      <div className="card overflow-hidden">
        <div className="px-5 py-4">
          <p className="font-semibold">Open follow-ups</p>
          <p className="text-sm text-ink-soft">{open.length} waiting · {done.length} completed</p>
        </div>
        {open.length === 0 ? (
          <p className="px-5 pb-6 text-ink-soft">No open follow-ups.</p>
        ) : (
          <table className="data">
            <thead>
              <tr>
                {!company ? <th>Company</th> : null}
                <th>Due</th>
                <th>Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {open.map((item) => (
                <tr key={item.id}>
                  {!company ? <td className="font-semibold">{names[item.companyId] || item.companyId}</td> : null}
                  <td>
                    {formatDate(item.dueDate)}
                    {item.dueDate < today ? <p className="text-xs text-seal">Overdue</p> : item.dueDate === today ? <p className="text-xs text-brass">Due today</p> : null}
                  </td>
                  <td>{item.note}</td>
                  <td className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button className="btn btn-ghost" type="button" onClick={() => void complete(item.id, true)}>
                        Done
                      </button>
                      <button className="btn btn-ghost" type="button" onClick={() => void remove(item.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {done.length ? (
        <div className="card overflow-hidden">
          <div className="px-5 py-4">
            <p className="font-semibold">Completed</p>
          </div>
          <ul className="space-y-3 px-5 pb-5">
            {done.slice(0, 8).map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 border-b border-dashed border-rule pb-3">
                <div>
                  <p className="font-semibold">{item.note}</p>
                  <p className="text-xs text-ink-soft">
                    {!company ? `${names[item.companyId] || item.companyId} · ` : ""}
                    Done {formatDate(item.completedAt)}
                  </p>
                </div>
                <span className="text-xs font-semibold text-ledger">Done</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
