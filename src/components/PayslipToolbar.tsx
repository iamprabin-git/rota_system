"use client";

import { useRouter } from "next/navigation";

export function PayslipToolbar({ id, canDelete = true }: { id: string; canDelete?: boolean }) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm("Delete this payslip?")) return;
    await fetch(`/api/payslips/${id}`, { method: "DELETE" });
    router.push("/agent/payslips");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button className="btn btn-primary" type="button" onClick={() => window.print()}>
        Print / PDF
      </button>
      {canDelete ? (
        <button className="btn btn-ghost" type="button" onClick={onDelete}>
          Delete
        </button>
      ) : null}
    </div>
  );
}
