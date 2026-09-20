import { redirect } from "next/navigation";
import { PaymentsBoard } from "@/components/PaymentsBoard";
import { getSession } from "@/lib/auth";
import { getEmployee, listPayments } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MyPaymentsPage() {
  const user = await getSession();
  if (!user?.employeeId) redirect("/login");
  const employee = getEmployee(user.employeeId);
  if (!employee) redirect("/login");

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-ink-soft">
        Payslips create a due amount automatically. Mark a line received when the money hits your account.
      </p>
      <PaymentsBoard employee={employee} payments={listPayments(employee.id)} canCreateDue />
    </div>
  );
}
