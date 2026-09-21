import { isoDate } from "./format";
import type { Company, CompanyAccess, CompanyFollowUp, CompanyLive, CompanyPayment, CrmStage } from "./types";

export const COMPANY_ACCESS_LABELS: Record<CompanyAccess, string> = {
  allowed: "Allowed",
  disallowed: "Disallowed",
};

export const COMPANY_LIVE_LABELS: Record<CompanyLive, string> = {
  active: "Active",
  deactive: "Deactive",
};

export const CRM_STAGE_LABELS: Record<CrmStage, string> = {
  lead: "Lead",
  onboarding: "Onboarding",
  active: "Active",
  "at-risk": "At risk",
  closed: "Closed",
};

export function companyAccess(company?: Pick<Company, "access"> | null): CompanyAccess {
  return company?.access === "disallowed" ? "disallowed" : "allowed";
}

export function isCompanyAllowed(company?: Pick<Company, "access"> | null) {
  return companyAccess(company) === "allowed";
}

export function companyLiveValue(company?: Pick<Company, "live"> | null): CompanyLive {
  return company?.live === "deactive" ? "deactive" : "active";
}

export function hasDueCompanyPayment(payments: CompanyPayment[] = []) {
  return payments.some((item) => item.status === "due");
}

export function companyLive(company?: Pick<Company, "access" | "live"> | null, payments: CompanyPayment[] = []): CompanyLive {
  if (companyAccess(company) === "disallowed") return "deactive";
  if (hasDueCompanyPayment(payments)) return "deactive";
  return companyLiveValue(company);
}

export function companyCrmStage(company?: Pick<Company, "crmStage"> | null): CrmStage {
  const stage = company?.crmStage;
  return stage === "lead" || stage === "onboarding" || stage === "at-risk" || stage === "closed" ? stage : "active";
}

export function withCompanyDefaults(company: Company): Company {
  return {
    ...company,
    access: companyAccess(company),
    live: companyLiveValue(company),
    crmStage: companyCrmStage(company),
    crmNotes: company.crmNotes || "",
    nextFollowUp: company.nextFollowUp || "",
    lastContactedAt: company.lastContactedAt || "",
    logo: company.logo || "",
  };
}

export function followUpOpen(item: CompanyFollowUp, today = isoDate(new Date())) {
  return !item.completedAt && Boolean(item.dueDate);
}

export function followUpOverdue(item: CompanyFollowUp, today = isoDate(new Date())) {
  return followUpOpen(item, today) && item.dueDate < today;
}

export function followUpDue(item: CompanyFollowUp, today = isoDate(new Date())) {
  return followUpOpen(item, today) && item.dueDate <= today;
}
