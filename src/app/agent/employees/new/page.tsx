import { EmployeeForm } from "@/components/EmployeeForm";
import { PageHeading } from "@/components/PageHeading";
import { requirePage } from "@/lib/auth";

export default async function NewAgentEmployeePage() {
  await requirePage("agent");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeading
        icon="userPlus"
        kicker="New record"
        title="Add a person"
        description="Store their hourly wage, tax code and deductions. Hours are entered on the rota or when you generate a payslip."
      />
      <EmployeeForm />
    </div>
  );
}
