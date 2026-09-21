"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusPill } from "@/components/StatusPill";
import { formatDate, money } from "@/lib/format";
import type { Company, CompanyPayment } from "@/lib/types";

export function CompanyBillingBoard({
  companies,
  payments,
  companyId,
}: {
  companies: Company[];
  payments: CompanyPayment[];
  companyId?: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");
  const [selected, setSelected] = useState(companyId || companies[0]?.id || "");
  const [error, setError] = useState("");
  const due = payments.filter((item) => item.status === "due").reduce((sum, item) => sum + item.amount, 0);
  const received = payments.filter((item) => item.status === "received").reduce((sum, item) => sum + item.amount, 0);
  const names = Object.fromEntries(companies.map((company) => [company.id, company.tradingName || company.name]));

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/company-payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: selected, amount: Number(amount), dueDate, notes, reference, status: "due" }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Could not save company payment.");
      return;
    }
    setAmount("");
    setNotes("");
    setReference("");
    router.refresh();
  }

  async function mark(id: string, status: "due" | "received") {
    await fetch("/api/company-payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this company payment?")) return;
    await fetch(`/api/company-payments?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="card stat">
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">Due from companies</p>
          <p className="serif mt-2 text-3xl text-seal">{money(due)}</p>
        </article>
        <article className="card stat">
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">Received</p>
          <p className="serif mt-2 text-3xl text-ledger">{money(received)}</p>
        </article>
      </div>

      <form onSubmit={create} className="card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="serif col-span-full text-2xl">Add company payment</h2>
        {!companyId ? (
          <label className="field col-span-full">
            Company
            <select value={selected} onChange={(event) => setSelected(event.target.value)} required>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.tradingName || company.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="field">
          Amount (£)
          <input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <label className="field">
          Due date
          <input type="date" required value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        <label className="field">
          Reference
          <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Invoice or period" />
        </label>
        <label className="field">
          Notes
          <input value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        {error ? <p className="col-span-full text-sm text-seal">{error}</p> : null}
        <button className="btn btn-primary sm:col-span-2" type="submit">
          Save payment
        </button>
      </form>

      <div className="card overflow-hidden">
        {payments.length === 0 ? (
          <p className="p-6 text-ink-soft">No company payments yet.</p>
        ) : (
          <table className="data">
            <thead>
              <tr>
                {!companyId ? <th>Company</th> : null}
                <th>Due</th>
                <th>Amount</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {payments.map((item) => (
                <tr key={item.id}>
                  {!companyId ? <td className="font-semibold">{names[item.companyId] || item.companyId}</td> : null}
                  <td>
                    {formatDate(item.dueDate)}
                    {item.reference ? <p className="text-xs text-ink-soft">{item.reference}</p> : null}
                  </td>
                  <td className="tabular-nums font-semibold">{money(item.amount)}</td>
                  <td>
                    <StatusPill status={item.status} kind="pay" />
                  </td>
                  <td className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {item.status === "due" ? (
                        <button className="btn btn-ghost" type="button" onClick={() => void mark(item.id, "received")}>
                          Mark received
                        </button>
                      ) : (
                        <button className="btn btn-ghost" type="button" onClick={() => void mark(item.id, "due")}>
                          Mark due
                        </button>
                      )}
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
    </div>
  );
}
