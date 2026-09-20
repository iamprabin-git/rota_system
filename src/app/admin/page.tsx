import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { requirePage } from "@/lib/auth";
import { listAgents, listCompanies, listEmployees } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage() {
  await requirePage("admin");
  const companies = listCompanies();

  return (
    <div className="space-y-6">
      <PageHeading
        icon="building"
        kicker="Admin panel"
        title="Companies"
        description="Platform admin manages companies. Each company has its own agents (payroll) and users (staff records)."
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
                    <p className="text-xs text-ink-soft">{company.name}</p>
                  </td>
                  <td className="tabular-nums">{company.payeReference || "—"}</td>
                  <td>{listAgents(company.id).length}</td>
                  <td>{listEmployees(company.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
