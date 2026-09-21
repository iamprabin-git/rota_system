import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { canAccessEmployee } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { deletePayslip, getPayslip } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const payslip = await getPayslip(id);
  if (!payslip) return NextResponse.json({ error: "Payslip not found." }, { status: 404 });
  if (!await canAccessEmployee(auth.user, payslip.employeeId)) {
    return NextResponse.json({ error: "You cannot view this statement." }, { status: 403 });
  }
  return NextResponse.json(payslip);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser("agent");
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const payslip = await getPayslip(id);
  if (!payslip) return NextResponse.json({ error: "Payslip not found." }, { status: 404 });
  if (!await canAccessEmployee(auth.user, payslip.employeeId)) {
    return NextResponse.json({ error: "You cannot delete this statement." }, { status: 403 });
  }
  await deletePayslip(id);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
