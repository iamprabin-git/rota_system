import { redirect } from "next/navigation";
import { StaffShell } from "@/components/staff/StaffShell";
import { getSession } from "@/lib/auth";
import { getEmployee } from "@/lib/db";
import { buildStaffNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (user?.role !== "user" || !user.employeeId) redirect("/login");
  const employee = getEmployee(user.employeeId);
  if (!employee) redirect("/login");

  return (
    <StaffShell employee={employee} notifications={buildStaffNotifications(employee.id)}>
      {children}
    </StaffShell>
  );
}
