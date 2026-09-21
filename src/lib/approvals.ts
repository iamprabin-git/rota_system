import type { AccountStatus, ApprovalStatus, HourLog, Payslip, User } from "./types";

export const ACCOUNT_LABELS: Record<AccountStatus, string> = {
  pending: "Awaiting approval",
  active: "Active",
  disabled: "Disabled",
};

export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  pending: "Awaiting approval",
  approved: "Approved",
  rejected: "Rejected",
};

export function accountStatus(user?: Pick<User, "status"> | null): AccountStatus {
  return user?.status === "pending" || user?.status === "disabled" ? user.status : "active";
}

export function isAccountActive(user?: Pick<User, "status"> | null) {
  return accountStatus(user) === "active";
}

export function approvalStatus(value?: ApprovalStatus, fallback: ApprovalStatus = "approved"): ApprovalStatus {
  return value === "pending" || value === "approved" || value === "rejected" ? value : fallback;
}

export function withHourApproval(log: HourLog, fallback: ApprovalStatus = "approved"): HourLog {
  return {
    ...log,
    status: approvalStatus(log.status, fallback),
    reviewNote: log.reviewNote || "",
    reviewedAt: log.reviewedAt || "",
    reviewedBy: log.reviewedBy || "",
  };
}

export function withPayslipApproval(slip: Payslip, fallback: ApprovalStatus = "approved"): Payslip {
  return {
    ...slip,
    status: approvalStatus(slip.status, fallback),
    reviewNote: slip.reviewNote || "",
    reviewedAt: slip.reviewedAt || "",
    reviewedBy: slip.reviewedBy || "",
  };
}

export function accountMessage(status: AccountStatus) {
  if (status === "pending") return "This login is waiting for payroll to approve it.";
  if (status === "disabled") return "This login has been disabled.";
  return "";
}
