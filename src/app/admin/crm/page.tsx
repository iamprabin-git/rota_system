import { CompanyCrmBoard } from "@/components/CompanyCrmBoard";
import { PageHeading } from "@/components/PageHeading";
import { requirePage } from "@/lib/auth";
import { listCompanies, listCompanyFollowUps } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCrmPage() {
  await requirePage("admin");
  const [companies, followUps] = await Promise.all([listCompanies(), listCompanyFollowUps()]);

  return (
    <div className="space-y-6">
      <PageHeading description="Track company follow-ups, account notes and next contact dates." />
      <CompanyCrmBoard companies={companies} followUps={followUps} />
    </div>
  );
}
