import { CompanyBillingBoard } from "@/components/CompanyBillingBoard";
import { PageHeading } from "@/components/PageHeading";
import { requirePage } from "@/lib/auth";
import { listCompanies, listCompanyPayments } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requirePage("admin");
  const [companies, payments] = await Promise.all([listCompanies(), listCompanyPayments()]);

  return (
    <div className="space-y-6">
      <PageHeading description="Invoice companies for platform use. This is separate from staff payslip payments." />
      <CompanyBillingBoard companies={companies} payments={payments} />
    </div>
  );
}
