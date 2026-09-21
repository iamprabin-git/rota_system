import { redirect } from "next/navigation";
import { MyRota } from "@/components/MyRota";
import { getSession } from "@/lib/auth";
import { getEmployee, listHourLogs, listRota } from "@/lib/db";
import { startOfWeek } from "@/lib/format";
import { upcomingShifts } from "@/lib/shifts";

export const dynamic = "force-dynamic";

export default async function MyRotaPage() {
  const user = await getSession();
  if (!user?.employeeId) redirect("/login");
  const employee = await getEmployee(user.employeeId);
  if (!employee) redirect("/login");
  const weekStart = startOfWeek();
  const [allRota, logs] = await Promise.all([
    listRota(undefined, employee.companyId),
    listHourLogs(employee.id),
  ]);
  const mine = allRota.filter((entry) => entry.employeeId === employee.id);
  const weekRota = mine.filter((entry) => entry.weekStart === weekStart);

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-ink-soft">
        Advance notice of your week: start and finish times for each day. Payroll sets the rota. You get a reminder 1
        hour before a shift starts.
      </p>
      <MyRota
        initialWeek={weekStart}
        initialRota={weekRota}
        logs={logs}
        nextShift={upcomingShifts(logs, mine)[0] || null}
      />
    </div>
  );
}
