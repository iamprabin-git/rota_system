import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteCompany, getCompany, upsertCompany } from "@/lib/db";
import type { Company } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const company = getCompany(id);
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });
  return NextResponse.json(company);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const existing = getCompany(id);
  if (!existing) return NextResponse.json({ error: "Company not found." }, { status: 404 });
  const body = (await request.json()) as Partial<Company>;
  if (!body.name?.trim() && !existing.name) {
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  }
  return NextResponse.json(
    upsertCompany({
      ...existing,
      ...body,
      id,
      name: (body.name ?? existing.name).trim(),
    }),
  );
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const { id } = await context.params;
  if (!getCompany(id)) return NextResponse.json({ error: "Company not found." }, { status: 404 });
  deleteCompany(id);
  return NextResponse.json({ ok: true });
}
