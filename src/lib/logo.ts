import type { Company } from "./types";

export function companyLogoUrl(company?: Pick<Company, "id" | "logo"> | null) {
  if (!company?.id || !company.logo) return "";
  return `/api/company/logo?companyId=${encodeURIComponent(company.id)}&v=${encodeURIComponent(company.logo)}`;
}
