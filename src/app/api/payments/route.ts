import { NextResponse } from "next/server";
import { canAccessEmployee, ownEmployeeId, scopedCompanyId } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { deletePayment, getEmployee, getPayment, listPayments, upsertPayment } from "@/lib/db";
import type { Payment } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const employeeId = ownEmployeeId(auth.user, searchParams.get("employeeId"));
  if (auth.user.role === "admin") {
    return NextResponse.json({ error: "You do not have access." }, { status: 403 });
  }
  return NextResponse.json(listPayments(employeeId || undefined, scopedCompanyId(auth.user)));
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const body = (await request.json()) as Partial<Payment>;
  const employeeId = ownEmployeeId(auth.user, body.employeeId);
  if (!employeeId || !canAccessEmployee(auth.user, employeeId)) {
    return NextResponse.json({ error: "You cannot add a payment for this person." }, { status: 403 });
  }
  if (!getEmployee(employeeId)) {
    return NextResponse.json({ error: "Staff record not found." }, { status: 404 });
  }
  const amount = Number(body.amount);
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Enter a payment amount." }, { status: 400 });
  }
  const payment: Payment = {
    id: `pay_${crypto.randomUUID()}`,
    employeeId,
    payslipId: body.payslipId || null,
    amount,
    status: body.status === "received" ? "received" : "due",
    dueDate: body.dueDate || new Date().toISOString().slice(0, 10),
    paidDate: body.status === "received" ? body.paidDate || new Date().toISOString().slice(0, 10) : "",
    method: body.method || "",
    reference: body.reference?.trim() || "",
    notes: body.notes?.trim() || "",
    createdAt: new Date().toISOString(),
  };
  return NextResponse.json(upsertPayment(payment), { status: 201 });
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const body = (await request.json()) as Partial<Payment> & { id?: string };
  const existing = body.id ? getPayment(body.id) : undefined;
  if (!existing) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  if (!canAccessEmployee(auth.user, existing.employeeId)) {
    return NextResponse.json({ error: "You cannot change this payment." }, { status: 403 });
  }
  const status = body.status === "received" ? "received" : body.status === "due" ? "due" : existing.status;
  return NextResponse.json(
    upsertPayment({
      ...existing,
      ...body,
      id: existing.id,
      employeeId: existing.employeeId,
      amount: Number(body.amount ?? existing.amount),
      status,
      paidDate:
        status === "received"
          ? body.paidDate || existing.paidDate || new Date().toISOString().slice(0, 10)
          : "",
    }),
  );
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  if (auth.user.role !== "agent") {
    return NextResponse.json({ error: "Company payroll access only." }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const existing = id ? getPayment(id) : undefined;
  if (!existing) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  if (!canAccessEmployee(auth.user, existing.employeeId)) {
    return NextResponse.json({ error: "You cannot delete this payment." }, { status: 403 });
  }
  deletePayment(existing.id);
  return NextResponse.json({ ok: true });
}
