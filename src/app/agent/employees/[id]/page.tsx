import { notFound } from "next/navigation";
import { EmployeeForm } from "@/components/EmployeeForm";
import { PageHeading } from "@/components/PageHeading";
import { requirePage } from "@/lib/auth";
import { getEmployee } from "@/lib/db";
import { fullName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditAgentEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("agent");
  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee || employee.companyId !== user.companyId) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeading
        icon="user"
        kicker={employee.payrollNumber}
        title={fullName(employee)}
        description={`${employee.jobTitle} · ${employee.hourlyRate.toLocaleString("en-GB", { style: "currency", currency: "GBP" })} per hour`}
      />
      <EmployeeForm employee={employee} />
    </div>
  );
}
