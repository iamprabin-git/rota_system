import { notFound } from "next/navigation";
import { AgentForm } from "@/components/AgentForm";
import { CompanyAccessCard } from "@/components/CompanyAccessCard";
import { CompanyBillingBoard } from "@/components/CompanyBillingBoard";
import { CompanyCrmBoard } from "@/components/CompanyCrmBoard";
import { CompanyForm } from "@/components/CompanyForm";
import { Icon, type IconName } from "@/components/Icon";
import { PageHeading, SectionHeading } from "@/components/PageHeading";
import { RemoveAgentButton } from "@/components/RemoveAgentButton";
import { ResetAgentPassword } from "@/components/ResetAgentPassword";
import { RemoveCompanyButton } from "@/components/RemoveCompanyButton";
import { requirePage } from "@/lib/auth";
import { getCompany, listAgents, listCompanyFollowUps, listCompanyPayments, listEmployees, listPayslips } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("admin");
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();
  const [agents, people, payslips, payments, followUps] = await Promise.all([
    listAgents(company.id),
    listEmployees(company.id),
    listPayslips(undefined, company.id),
    listCompanyPayments(company.id),
    listCompanyFollowUps(company.id),
  ]);

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
                        <div className="flex flex-wrap justify-end gap-2">
                          <ResetAgentPassword id={agent.id} name={agent.name} />
                          <RemoveAgentButton id={agent.id} name={agent.name} />
                        </div>
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

      <CompanyAccessCard
        company={company}
        dueAmount={payments.filter((item) => item.status === "due").reduce((sum, item) => sum + item.amount, 0)}
      />

      <section className="space-y-4">
        <SectionHeading icon="wallet" title="Company payments" description="Platform invoices for this employer." />
        <CompanyBillingBoard companies={[company]} payments={payments} companyId={company.id} />
      </section>

      <section className="space-y-4">
        <SectionHeading icon="phone" title="CRM follow-up" description="Notes and next contact for this company." />
        <CompanyCrmBoard companies={[company]} followUps={followUps} company={company} />
      </section>
    </div>
  );
}
