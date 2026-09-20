"use client";

import { useRouter } from "next/navigation";

export function RemoveAgentButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  async function onRemove() {
    if (!confirm(`Remove agent ${name}?`)) return;
    await fetch(`/api/agents/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button className="btn btn-ghost" type="button" onClick={onRemove}>
      Remove
    </button>
  );
}
