import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { PageHeading, SectionHeading } from "@/components/PageHeading";
import { requirePage } from "@/lib/auth";
import { companyAccess, followUpDue } from "@/lib/company";
import { listAgents, listCompanies, listCompanyFollowUps, listCompanyPayments, listEmployees, listPayslips, storageLabel } from "@/lib/db";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requirePage("admin");
  const [companies, agents, people, payslips, invoices, followUps] = await Promise.all([
    listCompanies(),
    listAgents(),
    listEmployees(),
    listPayslips(),
    listCompanyPayments(),
    listCompanyFollowUps(),
  ]);
  const blocked = companies.filter((company) => companyAccess(company) === "disallowed").length;
  const dueInvoices = invoices.filter((item) => item.status === "due");
  const deactive = companies.filter(
    (company) =>
      companyAccess(company) === "allowed" &&
      (company.live === "deactive" || dueInvoices.some((item) => item.companyId === company.id)),
  ).length;
  const dueFollowUps = followUps.filter((item) => followUpDue(item));

  return (
    <div className="space-y-8">
      <PageHeading
        description={`Manage companies and the agents who run payroll for each one. Live data: ${storageLabel()}.`}
        actions={
          <>
            <Link href="/admin/crm" className="btn btn-ghost">
              <Icon name="phone" size={16} />
              CRM
            </Link>
            <Link href="/admin/companies" className="btn btn-ghost">
              <Icon name="building" size={16} />
              All companies
            </Link>
            <Link href="/admin/companies/new" className="btn btn-primary">
              <Icon name="buildingPlus" size={16} />
              Add company
            </Link>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["building", "Companies", String(companies.length), deactive ? `${deactive} deactive` : blocked ? `${blocked} disallowed` : "Employers on the platform"],
            ["wallet", "Company payments due", money(dueInvoices.reduce((sum, item) => sum + item.amount, 0)), `${dueInvoices.length} invoices`],
            ["phone", "Follow-ups due", String(dueFollowUps.length), "CRM contacts waiting"],
            ["users", "Agents", String(agents.length), `${people.length} people · ${payslips.length} slips`],
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
        <article className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <SectionHeading icon="building" title="Companies" />
            <Link href="/admin/companies" className="text-sm font-semibold text-seal">
              View all
            </Link>
          </div>
          {companies.length === 0 ? (
            <p className="px-5 pb-6 text-ink-soft">No companies yet. Add an employer to create agent logins.</p>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Agents</th>
                  <th>People</th>
                </tr>
              </thead>
              <tbody>
                {companies.slice(0, 6).map((company) => (
                  <tr key={company.id}>
                    <td>
                      <Link href={`/admin/companies/${company.id}`} className="font-semibold">
                        {company.tradingName || company.name}
                      </Link>
                      <p className="text-xs text-ink-soft">{company.city || company.name}</p>
                    </td>
                    <td>{agents.filter((agent) => agent.companyId === company.id).length}</td>
                    <td>{people.filter((person) => person.companyId === company.id).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className="card p-5">
          <SectionHeading icon="users" title="Agents" />
          <ul className="mt-4 space-y-3">
            {agents.length === 0 ? (
              <li className="text-ink-soft">No agents yet.</li>
            ) : (
              agents.slice(0, 8).map((agent) => {
                const company = companies.find((item) => item.id === agent.companyId);
                return (
                  <li key={agent.id} className="flex items-center justify-between gap-3 border-b border-dashed border-rule pb-3">
                    <div>
                      <p className="font-semibold">{agent.name}</p>
                      <p className="text-xs text-ink-soft">{company?.tradingName || company?.name || "No company"}</p>
                    </div>
                    <Link href={agent.companyId ? `/admin/companies/${agent.companyId}` : "/admin/companies"} className="text-sm font-semibold text-seal">
                      Open
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
          <Link href="/admin/agents" className="btn btn-ghost mt-5 w-full">
            <Icon name="users" size={16} />
            All agents
          </Link>
        </article>
      </section>
    </div>
  );
}
