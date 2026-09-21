import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHeading } from "@/components/PageHeading";
import { requirePage } from "@/lib/auth";
import { listEmployees, listPayslips } from "@/lib/db";
import { fullName, money, niNumberDisplay } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AgentEmployeesPage() {
  const user = await requirePage("agent");
  const employees = await listEmployees(user.companyId || undefined);
  const payslips = await listPayslips(undefined, user.companyId || undefined);

  return (
    <div className="space-y-6">
      <PageHeading
        actions={
          <Link href="/agent/employees/new" className="btn btn-primary">
            <Icon name="userPlus" size={16} />
            Add person
          </Link>
        }
      />
      <div className="card overflow-hidden">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Tax code</th>
              <th>NI</th>
              <th>Hourly wage</th>
              <th>Payslips</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>
                  <Link href={`/agent/employees/${employee.id}`} className="font-semibold">
                    {fullName(employee)}
                  </Link>
                  <p className="text-xs text-ink-soft">{employee.payrollNumber}</p>
                </td>
                <td>
                  {employee.jobTitle}
                  <p className="text-xs text-ink-soft">{employee.department}</p>
                </td>
                <td className="tabular-nums">{employee.taxCode}</td>
                <td className="text-sm">{niNumberDisplay(employee.niNumber)}</td>
                <td className="font-semibold tabular-nums">{money(employee.hourlyRate)}</td>
                <td>{payslips.filter((slip) => slip.employeeId === employee.id).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
