import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { scopedCompanyId } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { listEmployees, setStaffLogin, upsertEmployee } from "@/lib/db";
import type { Employee } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser("agent");
  if (auth.error) return auth.error;
  const companyId = scopedCompanyId(auth.user);
  if (!companyId) return NextResponse.json({ error: "No company is linked to this agent." }, { status: 403 });
  return NextResponse.json(await listEmployees(companyId));
}

export async function POST(request: Request) {
  const auth = await requireUser("agent");
  if (auth.error) return auth.error;
  const companyId = scopedCompanyId(auth.user);
  if (!companyId) return NextResponse.json({ error: "No company is linked to this agent." }, { status: 403 });
  const body = (await request.json()) as Partial<Employee> & { password?: string };
  if (!body.firstName?.trim() || !body.lastName?.trim()) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  }
  if (!body.hourlyRate || Number(body.hourlyRate) <= 0) {
    return NextResponse.json({ error: "Hourly rate must be greater than zero." }, { status: 400 });
  }
  if (body.email?.trim() && !body.password) {
    return NextResponse.json({ error: "Add a login password for this email." }, { status: 400 });
  }

  const employee: Employee = {
    id: `emp_${crypto.randomUUID()}`,
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    jobTitle: body.jobTitle?.trim() || "Team member",
    department: body.department?.trim() || "",
    payrollNumber: body.payrollNumber?.trim() || `RS-${String(Date.now()).slice(-4)}`,
    niNumber: (body.niNumber || "").replace(/\s+/g, "").toUpperCase(),
    taxCode: (body.taxCode || "1257L").trim().toUpperCase(),
    taxRegion: body.taxRegion || "england",
    niCategory: body.niCategory || "A",
    hourlyRate: Number(body.hourlyRate),
    overtimeMultiplier: Number(body.overtimeMultiplier) || 1.5,
    startDate: body.startDate || new Date().toISOString().slice(0, 10),
    dateOfBirth: body.dateOfBirth || "",
    studentLoan: body.studentLoan || "none",
    postgraduateLoan: Boolean(body.postgraduateLoan),
    pensionEmployeePercent: Number(body.pensionEmployeePercent ?? 5),
    pensionEmployerPercent: Number(body.pensionEmployerPercent ?? 3),
    pensionBasis: body.pensionBasis || "qualifying",
    paymentMethod: body.paymentMethod || "bacs",
    bankSortCode: body.bankSortCode || "",
    bankAccountLast4: body.bankAccountLast4 || "",
    email: (body.email || "").trim().toLowerCase(),
    companyId,
    createdAt: new Date().toISOString(),
  };

  const saved = await upsertEmployee(employee);
  await setStaffLogin(saved, body.password);
  revalidatePath("/", "layout");
  return NextResponse.json(saved, { status: 201 });
}
