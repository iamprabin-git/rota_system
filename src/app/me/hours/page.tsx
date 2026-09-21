import { redirect } from "next/navigation";
import { HoursTracker } from "@/components/HoursTracker";
import { getSession } from "@/lib/auth";
import { getEmployee, listHourLogs } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MyHoursPage() {
  const user = await getSession();
  if (!user?.employeeId) redirect("/login");
  const employee = await getEmployee(user.employeeId);
  if (!employee) redirect("/login");
  const logs = await listHourLogs(employee.id);

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-ink-soft">
        Each entry is stored on your record and copied onto the weekly rota for payroll.
      </p>
      <HoursTracker employee={employee} logs={logs} />
    </div>
  );
}
