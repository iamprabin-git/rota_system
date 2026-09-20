import { NextResponse } from "next/server";
import { canAccessEmployee, scopedCompanyId } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { addPayslip, companyAddress, getCompany, getEmployee, listPayslips } from "@/lib/db";
import type { Payslip, PayslipInput } from "@/lib/types";
import { emptyDays, calculatePayslip, taxPeriodFor } from "@/lib/uk-payroll";
import { fullName } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  if (auth.user.role === "user") {
    return NextResponse.json(listPayslips(auth.user.employeeId || undefined));
  }
  if (auth.user.role === "agent") {
    const companyId = scopedCompanyId(auth.user);
    if (!companyId) return NextResponse.json({ error: "No company is linked to this agent." }, { status: 403 });
    return NextResponse.json(listPayslips(undefined, companyId));
  }
  return NextResponse.json({ error: "You do not have access." }, { status: 403 });
}

export async function POST(request: Request) {
  const auth = await requireUser("agent");
  if (auth.error) return auth.error;
  const body = (await request.json()) as Partial<PayslipInput>;
  const employee = body.employeeId ? getEmployee(body.employeeId) : undefined;
  if (!employee) {
    return NextResponse.json({ error: "Select an employee." }, { status: 400 });
  }
  if (!canAccessEmployee(auth.user, employee.id)) {
    return NextResponse.json({ error: "That person is not in your company." }, { status: 403 });
  }
  if (!body.periodStart || !body.periodEnd || !body.paymentDate) {
    return NextResponse.json({ error: "Pay period and payment date are required." }, { status: 400 });
  }

  const input: PayslipInput = {
    employeeId: employee.id,
    periodType: body.periodType || "weekly",
    periodStart: body.periodStart,
    periodEnd: body.periodEnd,
    paymentDate: body.paymentDate,
    taxPeriod: body.taxPeriod || taxPeriodFor(body.paymentDate, body.periodType || "weekly"),
    week1: Boolean(body.week1),
    days: { ...emptyDays(), ...body.days },
    totalHours: Number(body.totalHours) || 0,
    overtimeHours: Number(body.overtimeHours) || 0,
    bonus: Number(body.bonus) || 0,
    otherPayments: (body.otherPayments || []).filter((line) => line.label && line.amount),
    otherDeductions: (body.otherDeductions || []).filter((line) => line.label && line.amount),
  };

  const previous = listPayslips(employee.id);
  const calculation = calculatePayslip(employee, input, previous);
  if (calculation.grossPay <= 0) {
    return NextResponse.json({ error: "Enter working hours or other payments before generating a payslip." }, { status: 400 });
  }

  const company = getCompany(employee.companyId);
  if (!company) {
    return NextResponse.json({ error: "Company details are missing for this person." }, { status: 400 });
  }
  const payslip: Payslip = {
    id: `ps_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    ...input,
    snapshot: {
      employeeName: fullName(employee),
      jobTitle: employee.jobTitle,
      niNumber: employee.niNumber,
      taxCode: employee.taxCode,
      taxRegion: employee.taxRegion,
      niCategory: employee.niCategory,
      payrollNumber: employee.payrollNumber,
      paymentMethod: employee.paymentMethod,
      bankSortCode: employee.bankSortCode,
      bankAccountLast4: employee.bankAccountLast4,
      companyName: company.tradingName || company.name,
      companyAddress: companyAddress(company),
      payeReference: company.payeReference,
    },
    calculation,
  };

  return NextResponse.json(addPayslip(payslip), { status: 201 });
}
