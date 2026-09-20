"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";

export function AgentForm({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, name, email, password }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "Could not add agent.");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
      <label className="field">
        Name
        <input required value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="field">
        Email
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="field sm:col-span-2">
        Password
        <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      {error ? <p className="sm:col-span-2 text-sm text-warn">{error}</p> : null}
      <div className="sm:col-span-2">
        <button className="btn btn-primary" disabled={saving} type="submit">
          <Icon name="userPlus" size={16} />
          {saving ? "Adding…" : "Add agent"}
        </button>
      </div>
    </form>
  );
}
