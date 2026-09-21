import { NextResponse } from "next/server";
import { canAccessEmployee } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { getEmployee, listPayslips } from "@/lib/db";
import type { PayslipInput } from "@/lib/types";
import { calculatePayslip, emptyDays, taxPeriodFor } from "@/lib/uk-payroll";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const body = (await request.json()) as Partial<PayslipInput>;
  const employee = body.employeeId ? await getEmployee(body.employeeId) : undefined;
  if (!employee) {
    return NextResponse.json({ error: "Select an employee." }, { status: 400 });
  }
  if (!await canAccessEmployee(auth.user, employee.id)) {
    return NextResponse.json({ error: "You cannot calculate pay for this person." }, { status: 403 });
  }

  const paymentDate = body.paymentDate || new Date().toISOString().slice(0, 10);
  const periodType = body.periodType || "weekly";
  const input: PayslipInput = {
    employeeId: employee.id,
    periodType,
    periodStart: body.periodStart || paymentDate,
    periodEnd: body.periodEnd || paymentDate,
    paymentDate,
    taxPeriod: body.taxPeriod || taxPeriodFor(paymentDate, periodType),
    week1: Boolean(body.week1),
    days: { ...emptyDays(), ...body.days },
    totalHours: Number(body.totalHours) || 0,
    overtimeHours: Number(body.overtimeHours) || 0,
    bonus: Number(body.bonus) || 0,
    otherPayments: body.otherPayments || [],
    otherDeductions: body.otherDeductions || [],
  };

  return NextResponse.json({
    employee,
    calculation: calculatePayslip(employee, input, await listPayslips(employee.id)),
  });
}
