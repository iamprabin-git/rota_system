import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { canAccessEmployee } from "@/lib/access";
import { approvalStatus } from "@/lib/approvals";
import { requireUser } from "@/lib/auth";
import { deletePayslip, getPayslip, updatePayslip } from "@/lib/db";
import type { ApprovalStatus } from "@/lib/types";

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
  if (auth.user.role === "user" && payslip.status !== "approved") {
    return NextResponse.json({ error: "This statement is not available yet." }, { status: 403 });
  }
  return NextResponse.json(payslip);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser("agent");
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const payslip = await getPayslip(id);
  if (!payslip) return NextResponse.json({ error: "Payslip not found." }, { status: 404 });
  if (!await canAccessEmployee(auth.user, payslip.employeeId)) {
    return NextResponse.json({ error: "You cannot change this statement." }, { status: 403 });
  }
  const body = (await request.json()) as { status?: ApprovalStatus; reviewNote?: string };
  if (!body.status) return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
  const saved = await updatePayslip({
    ...payslip,
    status: approvalStatus(body.status, "pending"),
    reviewNote: body.reviewNote?.trim() || "",
    reviewedAt: new Date().toISOString(),
    reviewedBy: auth.user.id,
  });
  revalidatePath("/", "layout");
  return NextResponse.json(saved);
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
