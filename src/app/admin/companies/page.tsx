import Link from "next/link";
import { CompanyLiveSwitch } from "@/components/CompanyLiveSwitch";
import { CompanyMark } from "@/components/CompanyMark";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { StatusPill } from "@/components/StatusPill";
import { requirePage } from "@/lib/auth";
import { companyAccess, companyCrmStage } from "@/lib/company";
import { listAgents, listCompanies, listCompanyPayments, listEmployees } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage() {
  await requirePage("admin");
  const [companies, agents, people, invoices] = await Promise.all([
    listCompanies(),
    listAgents(),
    listEmployees(),
    listCompanyPayments(),
  ]);
  const dueByCompany = invoices.reduce<Record<string, number>>((acc, item) => {
    if (item.status !== "due") return acc;
    acc[item.companyId] = (acc[item.companyId] || 0) + item.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeading
        description="Only admin can create a company. Allow access, then switch Active or Deactive from payment."
        actions={
          <Link href="/admin/companies/new" className="btn btn-primary">
            <Icon name="buildingPlus" size={16} />
            Add company
          </Link>
        }
      />
      <div className="card overflow-hidden">
        {companies.length === 0 ? (
          <p className="p-6 text-ink-soft">No companies yet.</p>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Company</th>
                <th>Access</th>
                <th>Live</th>
                <th>CRM</th>
                <th>Agents</th>
                <th>People</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>
                    <Link href={`/admin/companies/${company.id}`} className="flex items-center gap-3 font-semibold">
                      <CompanyMark name={company.tradingName || company.name} logo={company.logo} companyId={company.id} size="sm" />
                      <span>
                        {company.tradingName || company.name}
                        <span className="block text-xs font-normal text-ink-soft">
                          {company.name}
                          {company.city ? ` · ${company.city}` : ""}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <StatusPill status={companyAccess(company)} kind="company" />
                  </td>
                  <td>
                    <CompanyLiveSwitch company={company} dueAmount={dueByCompany[company.id] || 0} compact />
                  </td>
                  <td>
                    <StatusPill status={companyCrmStage(company)} kind="crm" />
                    {company.nextFollowUp ? (
                      <p className="text-xs text-ink-soft">Next {company.nextFollowUp}</p>
                    ) : null}
                  </td>
                  <td>{agents.filter((agent) => agent.companyId === company.id).length}</td>
                  <td>{people.filter((person) => person.companyId === company.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
