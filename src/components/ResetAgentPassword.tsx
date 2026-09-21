"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResetAgentPassword({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSave() {
    setSaving(true);
    setError("");
    const response = await fetch(`/api/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "Could not update password.");
      return;
    }
    setPassword("");
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="text-right">
      <button className="btn btn-ghost" type="button" onClick={() => setOpen((value) => !value)}>
        Password
      </button>
      {open ? (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <input
            type="password"
            className="min-w-[12rem] flex-1"
            placeholder={`New password for ${name}`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="btn btn-primary" type="button" disabled={saving || password.length < 6} onClick={() => void onSave()}>
            {saving ? "Saving…" : "Save password"}
          </button>
          {error ? <p className="w-full text-sm text-warn">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
