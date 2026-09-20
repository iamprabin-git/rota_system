import { CompanyForm } from "@/components/CompanyForm";
import { PageHeading } from "@/components/PageHeading";
import { requirePage } from "@/lib/auth";
import { blankCompany } from "@/lib/db";

export default async function NewCompanyPage() {
  await requirePage("admin");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeading
        icon="buildingPlus"
        kicker="Admin panel"
        title="New company"
        description="Create an employer, then add agents who run payroll for that company."
      />
      <CompanyForm company={blankCompany()} endpoint="/api/companies" method="POST" redirectTo="/admin/companies" />
    </div>
  );
}
