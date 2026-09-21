import { notFound } from "next/navigation";
import { AgentForm } from "@/components/AgentForm";
import { CompanyForm } from "@/components/CompanyForm";
import { Icon, type IconName } from "@/components/Icon";
import { PageHeading, SectionHeading } from "@/components/PageHeading";
import { RemoveAgentButton } from "@/components/RemoveAgentButton";
import { RemoveCompanyButton } from "@/components/RemoveCompanyButton";
import { requirePage } from "@/lib/auth";
import { getCompany, listAgents, listEmployees, listPayslips } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("admin");
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();
  const agents = await listAgents(company.id);
  const people = await listEmployees(company.id);
  const payslips = await listPayslips(undefined, company.id);

  return (
    <div className="space-y-8">
      <PageHeading
        icon="building"
        kicker="Company"
        title={company.tradingName || company.name}
        description={`${company.name}${company.city ? ` · ${company.city}` : ""}`}
        actions={<RemoveCompanyButton id={company.id} name={company.name} />}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["users", "Agents", String(agents.length), "Payroll logins"],
            ["user", "People on payroll", String(people.length), "Staff records"],
            ["fileText", "Payslips", String(payslips.length), "Statements generated"],
            ["briefcase", "PAYE", company.payeReference || "—", "Employer reference"],
          ] as const
        ).map(([icon, label, value, hint]) => (
          <article key={label} className="card stat">
            <p className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft">
              <Icon name={icon as IconName} size={14} />
              {label}
            </p>
            <p className="serif mt-2 text-3xl">{value}</p>
            <p className="mt-1 text-sm text-ink-soft">{hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <SectionHeading icon="briefcase" title="Employer details" description="Printed on payslips for this company." />
          <CompanyForm company={company} endpoint={`/api/companies/${company.id}`} />
        </div>
        <div className="space-y-4">
          <SectionHeading
            icon="users"
            title="Agents"
            description="These logins open the agent panel for this company only."
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
        </div>
      </section>
    </div>
  );
}
