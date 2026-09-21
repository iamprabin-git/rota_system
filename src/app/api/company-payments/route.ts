import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteCompanyPayment, getCompany, getCompanyPayment, listCompanyPayments, syncCompanyLiveFromPayments, upsertCompanyPayment } from "@/lib/db";
import type { CompanyPayment, PaymentMethod, PaymentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const companyId = new URL(request.url).searchParams.get("companyId") || undefined;
  return NextResponse.json(await listCompanyPayments(companyId));
}

export async function POST(request: Request) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const body = (await request.json()) as Partial<CompanyPayment>;
  if (!body.companyId || !(await getCompany(body.companyId))) {
    return NextResponse.json({ error: "Choose a company." }, { status: 400 });
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a payment amount." }, { status: 400 });
  }
  const now = new Date().toISOString();
  const status: PaymentStatus = body.status === "received" ? "received" : "due";
  const saved = await upsertCompanyPayment({
    id: `cpay_${crypto.randomUUID()}`,
    companyId: body.companyId,
    amount,
    status,
    dueDate: body.dueDate || now.slice(0, 10),
    paidDate: status === "received" ? body.paidDate || now.slice(0, 10) : "",
    method: (body.method as PaymentMethod) || "bacs",
    reference: body.reference?.trim() || "",
    notes: body.notes?.trim() || "",
    createdAt: now,
  });
  await syncCompanyLiveFromPayments(saved.companyId);
  revalidatePath("/", "layout");
  return NextResponse.json(saved, { status: 201 });
}

export async function PUT(request: Request) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const body = (await request.json()) as Partial<CompanyPayment>;
  if (!body.id) return NextResponse.json({ error: "Missing payment." }, { status: 400 });
  const existing = await getCompanyPayment(body.id);
  if (!existing) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  const status: PaymentStatus = body.status === "received" || body.status === "due" ? body.status : existing.status;
  const saved = await upsertCompanyPayment({
    ...existing,
    ...body,
    id: existing.id,
    companyId: existing.companyId,
    amount: body.amount == null ? existing.amount : Number(body.amount),
    status,
    paidDate: status === "received" ? body.paidDate || existing.paidDate || new Date().toISOString().slice(0, 10) : "",
  });
  await syncCompanyLiveFromPayments(saved.companyId);
  revalidatePath("/", "layout");
  return NextResponse.json(saved);
}

export async function DELETE(request: Request) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const id = new URL(request.url).searchParams.get("id");
  const existing = id ? await getCompanyPayment(id) : undefined;
  if (!id || !existing) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  await deleteCompanyPayment(id);
  await syncCompanyLiveFromPayments(existing.companyId);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
