import { NextResponse } from "next/server";
import { canAccessEmployee } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { deleteEmployee, getEmployee, setStaffLogin, upsertEmployee } from "@/lib/db";
import type { Employee } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  if (!canAccessEmployee(auth.user, id)) {
    return NextResponse.json({ error: "You cannot view this record." }, { status: 403 });
  }
  const employee = getEmployee(id);
  if (!employee) return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  return NextResponse.json(employee);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser("agent");
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const existing = getEmployee(id);
  if (!existing) return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  if (!canAccessEmployee(auth.user, id)) {
    return NextResponse.json({ error: "You cannot change this record." }, { status: 403 });
  }
  const body = (await request.json()) as Partial<Employee> & { password?: string };
  const { password, ...fields } = body;
  const updated: Employee = {
    ...existing,
    ...fields,
    id,
    companyId: existing.companyId,
    firstName: (body.firstName ?? existing.firstName).trim(),
    lastName: (body.lastName ?? existing.lastName).trim(),
    niNumber: (body.niNumber ?? existing.niNumber).replace(/\s+/g, "").toUpperCase(),
    taxCode: (body.taxCode ?? existing.taxCode).trim().toUpperCase(),
    hourlyRate: Number(body.hourlyRate ?? existing.hourlyRate),
    email: (body.email ?? existing.email ?? "").trim().toLowerCase(),
  };
  if (!updated.firstName || !updated.lastName) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  }
  if (updated.hourlyRate <= 0) {
    return NextResponse.json({ error: "Hourly rate must be greater than zero." }, { status: 400 });
  }
  const saved = upsertEmployee(updated);
  setStaffLogin(saved, password);
  return NextResponse.json(saved);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser("agent");
  if (auth.error) return auth.error;
  const { id } = await context.params;
  if (!getEmployee(id)) return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  if (!canAccessEmployee(auth.user, id)) {
    return NextResponse.json({ error: "You cannot remove this record." }, { status: 403 });
  }
  deleteEmployee(id);
  return NextResponse.json({ ok: true });
}
