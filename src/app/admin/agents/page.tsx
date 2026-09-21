import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { RemoveAgentButton } from "@/components/RemoveAgentButton";
import { ResetAgentPassword } from "@/components/ResetAgentPassword";
import { requirePage } from "@/lib/auth";
import { listAgents, listCompanies } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  await requirePage("admin");
  const agents = await listAgents();
  const companies = await listCompanies();

  return (
    <div className="space-y-6">
      <PageHeading
        description="Agents belong to one company and sign in to that company's payroll panel."
        actions={
          <Link href="/admin/companies" className="btn btn-ghost">
            <Icon name="building" size={16} />
            Open a company to add
          </Link>
        }
      />
      <div className="card overflow-hidden">
        {agents.length === 0 ? (
          <p className="p-6 text-ink-soft">No agents yet. Open a company and add a payroll login.</p>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => {
                const company = companies.find((item) => item.id === agent.companyId);
                return (
                  <tr key={agent.id}>
                    <td className="font-semibold">{agent.name}</td>
                    <td>{agent.email}</td>
                    <td>
                      {company ? (
                        <Link href={`/admin/companies/${company.id}`} className="font-semibold">
                          {company.tradingName || company.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <ResetAgentPassword id={agent.id} name={agent.name} />
                        <RemoveAgentButton id={agent.id} name={agent.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
