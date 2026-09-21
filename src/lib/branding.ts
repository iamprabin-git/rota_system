import { getCompany, getEmployee } from "./db";
import { companyLogoUrl } from "./logo";
import { readObject } from "./storage";
import type { Company } from "./types";

export { companyLogoUrl };

export async function companyLogoSrc(company?: Pick<Company, "id" | "logo"> | null) {
  if (!company?.logo) return "";
  const file = await readObject(company.logo, "avatars");
  if (!file) return companyLogoUrl(company);
  return `data:${file.type};base64,${Buffer.from(file.bytes).toString("base64")}`;
}

export async function companyBrand(companyId?: string | null) {
  const company = companyId ? await getCompany(companyId) : undefined;
  return {
    company,
    logoSrc: await companyLogoSrc(company),
  };
}

export async function brandForEmployee(employeeId?: string | null, fallbackCompanyId?: string | null) {
  const employee = employeeId ? await getEmployee(employeeId) : undefined;
  return companyBrand(employee?.companyId || fallbackCompanyId);
}
