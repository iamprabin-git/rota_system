import { ACCOUNT_LABELS, APPROVAL_LABELS } from "@/lib/approvals";
import { COMPANY_ACCESS_LABELS, COMPANY_LIVE_LABELS, CRM_STAGE_LABELS } from "@/lib/company";
import type { AccountStatus, ApprovalStatus, CompanyAccess, CompanyLive, CrmStage, PaymentStatus } from "@/lib/types";

const PAY_LABELS: Record<PaymentStatus, string> = {
  due: "Due",
  received: "Received",
};

export function StatusPill({
  status,
  kind = "approval",
}: {
  status?: ApprovalStatus | AccountStatus | CompanyAccess | CompanyLive | CrmStage | PaymentStatus;
  kind?: "approval" | "account" | "company" | "live" | "crm" | "pay";
}) {
  const value =
    status ||
    (kind === "account"
      ? "active"
      : kind === "company"
        ? "allowed"
        : kind === "live"
          ? "active"
          : kind === "crm"
            ? "active"
            : kind === "pay"
              ? "due"
              : "approved");
  const label =
    kind === "account"
      ? ACCOUNT_LABELS[value as AccountStatus]
      : kind === "company"
        ? COMPANY_ACCESS_LABELS[value as CompanyAccess]
        : kind === "live"
          ? COMPANY_LIVE_LABELS[value as CompanyLive]
          : kind === "crm"
            ? CRM_STAGE_LABELS[value as CrmStage]
            : kind === "pay"
              ? PAY_LABELS[value as PaymentStatus]
              : APPROVAL_LABELS[value as ApprovalStatus];
  const tone =
    value === "at-risk" || value === "deactive" || value === "closed"
      ? "disabled"
      : value === "lead" || value === "onboarding"
        ? "pending"
        : value === "received"
          ? "approved"
          : value;
  return <span className={`status-pill ${tone}`}>{label}</span>;
}
