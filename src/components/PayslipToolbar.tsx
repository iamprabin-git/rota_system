"use client";

import { useRouter } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { StatusPill } from "@/components/StatusPill";
import type { ApprovalStatus } from "@/lib/types";

export function PayslipToolbar({
  id,
  canDelete = true,
  canReview = false,
  status,
}: {
  id: string;
  canDelete?: boolean;
  canReview?: boolean;
  status?: ApprovalStatus;
}) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm("Delete this payslip?")) return;
    await fetch(`/api/payslips/${id}`, { method: "DELETE" });
    router.push("/agent/payslips");
    router.refresh();
  }

  async function review(next: ApprovalStatus) {
    await fetch(`/api/payslips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status ? <StatusPill status={status} /> : null}
      <PrintButton label="Print payslip" />
      {canReview && status !== "approved" ? (
        <button className="btn btn-primary" type="button" onClick={() => review("approved")}>
          Approve payslip
        </button>
      ) : null}
      {canReview && status === "pending" ? (
        <button className="btn btn-ghost" type="button" onClick={() => review("rejected")}>
          Reject
        </button>
      ) : null}
      {canDelete ? (
        <button className="btn btn-ghost" type="button" onClick={onDelete}>
          Delete
        </button>
      ) : null}
    </div>
  );
}
