import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteCompany, getCompany, upsertCompany } from "@/lib/db";
import type { Company } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const company = await getCompany(id);
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });
  return NextResponse.json(company);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const existing = await getCompany(id);
  if (!existing) return NextResponse.json({ error: "Company not found." }, { status: 404 });
  const body = (await request.json()) as Partial<Company>;
  if (!body.name?.trim() && !existing.name) {
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  }
  const saved = await upsertCompany({
    ...existing,
    ...body,
    id,
    name: (body.name ?? existing.name).trim(),
  });
  revalidatePath("/", "layout");
  return NextResponse.json(saved);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const { id } = await context.params;
  if (!(await getCompany(id))) return NextResponse.json({ error: "Company not found." }, { status: 404 });
  await deleteCompany(id);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
