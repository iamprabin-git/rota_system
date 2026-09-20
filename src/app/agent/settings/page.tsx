import { CompanyForm } from "@/components/CompanyForm";
import { PageHeading } from "@/components/PageHeading";
import { requirePage } from "@/lib/auth";
import { getCompany } from "@/lib/db";
import { NLW, PERIODS, PERSONAL_ALLOWANCE, RUK_BASIC_LIMIT } from "@/lib/uk-payroll";

export const dynamic = "force-dynamic";

export default async function AgentSettingsPage() {
  const user = await requirePage("agent");
  const company = getCompany(user.companyId);
  if (!company) {
    return <p className="text-ink-soft">No company is linked to this agent login.</p>;
  }

  return (
    <div className="space-y-8">
      <PageHeading
        icon="briefcase"
        kicker="Employer"
        title="Company details"
        description="These print on every itemised pay statement. Rates below are the HMRC 2026/27 figures used by the generator."
      />
      <CompanyForm company={company} />
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Income tax", `Personal allowance £${PERSONAL_ALLOWANCE.toLocaleString("en-GB")}. Basic rate 20% to £${RUK_BASIC_LIMIT.toLocaleString("en-GB")}; 40% to £125,140; 45% thereafter. Scotland uses starter to top rates.`],
          ["National Insurance", "Employee 8% between the primary threshold and upper earnings limit, 2% above. Employer 15% above the secondary threshold. Weekly PT £242 / UEL £967."],
          ["Hours & wage", `National Living Wage £${NLW.age21.toFixed(2)} (21+). Auto-enrolment minimum 5% employee / 3% employer of qualifying earnings. Student loans 9% (PG 6%) above plan thresholds.`],
        ].map(([title, copy]) => (
          <article key={title} className="card p-5">
            <h2 className="serif text-xl">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">{copy}</p>
          </article>
        ))}
      </section>
      <p className="text-xs text-ink-soft">
        Weekly, fortnightly, 4-weekly and monthly thresholds are applied from HMRC employer tables
        ({PERIODS.weekly.label} PT £{PERIODS.weekly.pt}, {PERIODS.monthly.label} PT £{PERIODS.monthly.pt}).
      </p>
    </div>
  );
}
