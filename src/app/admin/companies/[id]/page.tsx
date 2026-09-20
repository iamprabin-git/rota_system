import { notFound } from "next/navigation";
import { AgentForm } from "@/components/AgentForm";
import { CompanyForm } from "@/components/CompanyForm";
import { PageHeading, SectionHeading } from "@/components/PageHeading";
import { RemoveAgentButton } from "@/components/RemoveAgentButton";
import { RemoveCompanyButton } from "@/components/RemoveCompanyButton";
import { requirePage } from "@/lib/auth";
import { getCompany, listAgents, listEmployees } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("admin");
  const { id } = await params;
  const company = getCompany(id);
  if (!company) notFound();
  const agents = listAgents(company.id);
  const people = listEmployees(company.id);

  return (
    <div className="space-y-8">
      <PageHeading
        icon="building"
        kicker="Admin panel"
        title={company.tradingName || company.name}
        description={`${people.length} people on payroll · ${agents.length} agent${agents.length === 1 ? "" : "s"}`}
        actions={<RemoveCompanyButton id={company.id} name={company.name} />}
      />
      <CompanyForm company={company} endpoint={`/api/companies/${company.id}`} />
      <section className="space-y-4">
        <SectionHeading
          icon="users"
          title="Agents"
          description="Agents sign in to the company payroll panel. Users belong to the same company as staff records."
        />
        <div className="card overflow-hidden">
          {agents.length === 0 ? (
            <p className="p-6 text-ink-soft">No agents yet.</p>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td className="font-semibold">{agent.name}</td>
                    <td>{agent.email}</td>
                    <td className="text-right">
                      <RemoveAgentButton id={agent.id} name={agent.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <AgentForm companyId={company.id} />
      </section>
    </div>
  );
}
