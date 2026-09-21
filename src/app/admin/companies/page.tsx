import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { requirePage } from "@/lib/auth";
import { listAgents, listCompanies, listEmployees } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage() {
  await requirePage("admin");
  const companies = await listCompanies();
  const agents = await listAgents();
  const people = await listEmployees();

  return (
    <div className="space-y-6">
      <PageHeading
        description="Each company has its own agents for payroll and users for personal hours and pay."
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
                <th>PAYE</th>
                <th>Agents</th>
                <th>People</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>
                    <Link href={`/admin/companies/${company.id}`} className="font-semibold">
                      {company.tradingName || company.name}
                    </Link>
                    <p className="text-xs text-ink-soft">
                      {company.name}
                      {company.city ? ` · ${company.city}` : ""}
                    </p>
                  </td>
                  <td className="tabular-nums">{company.payeReference || "—"}</td>
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
