"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { StatusPill } from "@/components/StatusPill";
import type { AccountStatus, Employee } from "@/lib/types";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  employeeId: string | null;
  status: AccountStatus;
  phone?: string;
  jobTitle?: string;
};

export function UserManager({ employees, users }: { employees: Employee[]; users: ManagedUser[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [approveNow, setApproveNow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const linked = useMemo(() => new Set(users.map((user) => user.employeeId).filter(Boolean)), [users]);
  const availablePeople = employees.filter((employee) => !linked.has(employee.id));

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, employeeId: employeeId || undefined, phone, jobTitle, approveNow }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "Could not create user.");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    setEmployeeId("");
    setPhone("");
    setJobTitle("");
    setApproveNow(false);
    router.refresh();
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id);
    const response = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Could not update user.");
      return;
    }
    setResetId(null);
    setResetPassword("");
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Remove this user login?")) return;
    setBusy(id);
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeading description="Create staff logins, link them to a person on payroll, then approve them before they can sign in." />

      <form onSubmit={createUser} className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="serif col-span-full text-xl">Create user</h2>
        <label className="field">
          Name
          <input required value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="field">
          Email
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="field">
          Password
          <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label className="field">
          Linked person
          <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
            <option value="">None yet</option>
            {availablePeople.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName} · {employee.payrollNumber}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Phone
          <input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label className="field">
          Job title
          <input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
        </label>
        <label className="col-span-full flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" className="h-4 w-4" checked={approveNow} onChange={(event) => setApproveNow(event.target.checked)} />
          Approve immediately so they can sign in
        </label>
        {error ? <p className="col-span-full text-sm text-warn">{error}</p> : null}
        <div className="col-span-full">
          <button className="btn btn-primary" disabled={saving} type="submit">
            <Icon name="userPlus" size={16} />
            {saving ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>

      <div className="card overflow-hidden">
        {users.length === 0 ? (
          <p className="p-6 text-ink-soft">No user logins yet. Create one above or add a login password on a person record.</p>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>User</th>
                <th>Person</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const person = employees.find((employee) => employee.id === user.employeeId);
                return (
                  <tr key={user.id}>
                    <td>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-ink-soft">{user.email}</p>
                      {user.phone ? <p className="text-xs text-ink-soft">{user.phone}</p> : null}
                    </td>
                    <td>{person ? `${person.firstName} ${person.lastName}` : "Not linked"}</td>
                    <td>
                      <StatusPill kind="account" status={user.status} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {user.status === "pending" ? (
                          <button className="btn btn-primary" type="button" disabled={busy === user.id} onClick={() => patch(user.id, { status: "active" })}>
                            Approve
                          </button>
                        ) : null}
                        {user.status === "active" ? (
                          <button className="btn btn-ghost" type="button" disabled={busy === user.id} onClick={() => patch(user.id, { status: "disabled" })}>
                            Disable
                          </button>
                        ) : null}
                        {user.status === "disabled" ? (
                          <button className="btn btn-primary" type="button" disabled={busy === user.id} onClick={() => patch(user.id, { status: "active" })}>
                            Enable
                          </button>
                        ) : null}
                        <button className="btn btn-ghost" type="button" onClick={() => setResetId(resetId === user.id ? null : user.id)}>
                          Password
                        </button>
                        <button className="btn btn-ghost" type="button" disabled={busy === user.id} onClick={() => remove(user.id)}>
                          Remove
                        </button>
                      </div>
                      {resetId === user.id ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <input
                            type="password"
                            className="min-w-[12rem] flex-1"
                            placeholder="New password"
                            value={resetPassword}
                            onChange={(event) => setResetPassword(event.target.value)}
                          />
                          <button className="btn btn-primary" type="button" disabled={!resetPassword} onClick={() => patch(user.id, { password: resetPassword })}>
                            Save password
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
