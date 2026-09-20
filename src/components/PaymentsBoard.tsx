"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDate, money } from "@/lib/format";
import type { Employee, Payment } from "@/lib/types";

export function PaymentsBoard({
  employee,
  payments,
  canCreateDue,
}: {
  employee: Employee;
  payments: Payment[];
  canCreateDue: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"due" | "received">("due");
  const [error, setError] = useState("");
  const due = payments.filter((item) => item.status === "due").reduce((sum, item) => sum + item.amount, 0);
  const received = payments.filter((item) => item.status === "received").reduce((sum, item) => sum + item.amount, 0);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: employee.id,
        amount: Number(amount),
        dueDate,
        notes,
        status,
        method: employee.paymentMethod,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Could not save payment.");
      return;
    }
    setAmount("");
    setNotes("");
    router.refresh();
  }

  async function mark(id: string, next: "due" | "received") {
    await fetch("/api/payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="card stat">
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">Payment due</p>
          <p className="serif mt-2 text-3xl text-seal">{money(due)}</p>
        </article>
        <article className="card stat">
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">Payment received</p>
          <p className="serif mt-2 text-3xl text-ledger">{money(received)}</p>
        </article>
      </div>

      <form onSubmit={create} className="card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="serif col-span-full text-2xl">{canCreateDue ? "Add a payment" : "Record money received"}</h2>
        <label className="field">
          Amount (£)
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label className="field">
          Date
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        {canCreateDue ? (
          <label className="field">
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value as "due" | "received")}>
              <option value="due">Payment due</option>
              <option value="received">Payment received</option>
            </select>
          </label>
        ) : null}
        <label className="field sm:col-span-2">
          Notes
          <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Week ending, BACS ref…" />
        </label>
        {error ? <p className="col-span-full text-sm text-warn">{error}</p> : null}
        <button className="btn btn-primary sm:col-span-2" type="submit">
          Save payment
        </button>
      </form>

      <article className="card overflow-hidden">
        {payments.length === 0 ? (
          <p className="p-5 text-ink-soft">No payment records yet.</p>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>When</th>
                <th>Amount</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    {formatDate(payment.dueDate)}
                    {payment.notes ? <p className="text-xs text-ink-soft">{payment.notes}</p> : null}
                  </td>
                  <td className="font-semibold tabular-nums">{money(payment.amount)}</td>
                  <td>
                    <span className={payment.status === "received" ? "text-ledger" : "text-seal"}>
                      {payment.status === "received" ? "Received" : "Due"}
                    </span>
                    {payment.paidDate ? (
                      <p className="text-xs text-ink-soft">{formatDate(payment.paidDate)}</p>
                    ) : null}
                  </td>
                  <td>
                    {payment.status === "due" ? (
                      <button className="text-sm font-semibold text-ledger" type="button" onClick={() => mark(payment.id, "received")}>
                        Mark received
                      </button>
                    ) : (
                      <button className="text-sm text-ink-soft" type="button" onClick={() => mark(payment.id, "due")}>
                        Mark due
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </div>
  );
}
