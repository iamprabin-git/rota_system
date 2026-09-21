import { CompanyForm } from "@/components/CompanyForm";
import { PageHeading } from "@/components/PageHeading";
import { requirePage } from "@/lib/auth";
import { blankCompany } from "@/lib/db";

export default async function NewCompanyPage() {
  await requirePage("admin");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeading
        description="Create the company and the first agent login together. That email and password sign in to the agent panel."
      />
      <CompanyForm company={blankCompany()} endpoint="/api/companies" method="POST" redirectTo="/admin/companies" />
    </div>
  );
}
