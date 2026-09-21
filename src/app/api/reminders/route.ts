import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getEmployee, listHourLogs, listRota } from "@/lib/db";
import { dueShiftReminders, upcomingShifts } from "@/lib/shifts";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser("user");
  if (auth.error) return auth.error;
  if (!auth.user.employeeId) return NextResponse.json({ upcoming: [], due: [] });
  const employee = await getEmployee(auth.user.employeeId);
  const logs = await listHourLogs(auth.user.employeeId);
  const rota = (await listRota(undefined, employee?.companyId)).filter((entry) => entry.employeeId === auth.user.employeeId);
  const upcoming = upcomingShifts(logs, rota);
  return NextResponse.json({ upcoming, due: dueShiftReminders(upcoming) });
}
