import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteCompanyFollowUp, getCompany, getCompanyFollowUp, listCompanyFollowUps, upsertCompany, upsertCompanyFollowUp } from "@/lib/db";
import { isoDate } from "@/lib/format";
import { withCompanyDefaults } from "@/lib/company";
import type { CompanyFollowUp } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const companyId = new URL(request.url).searchParams.get("companyId") || undefined;
  return NextResponse.json(await listCompanyFollowUps(companyId));
}

async function syncCompanyFollowUp(companyId: string, dueDate: string, completed: boolean) {
  const company = await getCompany(companyId);
  if (!company) return;
  const current = withCompanyDefaults(company);
  await upsertCompany({
    ...current,
    lastContactedAt: completed ? isoDate(new Date()) : current.lastContactedAt,
    nextFollowUp: completed ? "" : dueDate || current.nextFollowUp,
  });
}

export async function POST(request: Request) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const body = (await request.json()) as Partial<CompanyFollowUp>;
  if (!body.companyId || !(await getCompany(body.companyId))) {
    return NextResponse.json({ error: "Choose a company." }, { status: 400 });
  }
  if (!body.note?.trim()) {
    return NextResponse.json({ error: "Add a follow-up note." }, { status: 400 });
  }
  const now = new Date().toISOString();
  const saved = await upsertCompanyFollowUp({
    id: `cfu_${crypto.randomUUID()}`,
    companyId: body.companyId,
    note: body.note.trim(),
    dueDate: body.dueDate || now.slice(0, 10),
    completedAt: "",
    createdAt: now,
  });
  await syncCompanyFollowUp(saved.companyId, saved.dueDate, false);
  revalidatePath("/", "layout");
  return NextResponse.json(saved, { status: 201 });
}

export async function PUT(request: Request) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const body = (await request.json()) as Partial<CompanyFollowUp> & { complete?: boolean };
  if (!body.id) return NextResponse.json({ error: "Missing follow-up." }, { status: 400 });
  const existing = await getCompanyFollowUp(body.id);
  if (!existing) return NextResponse.json({ error: "Follow-up not found." }, { status: 404 });
  const completedAt = body.complete === false ? "" : body.complete ? new Date().toISOString() : body.completedAt ?? existing.completedAt;
  const saved = await upsertCompanyFollowUp({
    ...existing,
    note: body.note?.trim() || existing.note,
    dueDate: body.dueDate || existing.dueDate,
    completedAt,
  });
  await syncCompanyFollowUp(saved.companyId, saved.dueDate, Boolean(saved.completedAt));
  revalidatePath("/", "layout");
  return NextResponse.json(saved);
}

export async function DELETE(request: Request) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !(await getCompanyFollowUp(id))) return NextResponse.json({ error: "Follow-up not found." }, { status: 404 });
  await deleteCompanyFollowUp(id);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
