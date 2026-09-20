"use client";

import { useRouter } from "next/navigation";

export function RemoveCompanyButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  async function onRemove() {
    if (!confirm(`Delete ${name}, its agents, people and payroll records?`)) return;
    await fetch(`/api/companies/${id}`, { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <button className="btn btn-ghost" type="button" onClick={onRemove}>
      Delete company
    </button>
  );
}
