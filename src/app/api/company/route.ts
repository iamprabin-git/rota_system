import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCompany, saveCompany } from "@/lib/db";
import type { Company } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser("agent");
  if (auth.error) return auth.error;
  const company = await getCompany(auth.user.companyId);
  if (!company) return NextResponse.json({ error: "No company is linked to this agent." }, { status: 404 });
  return NextResponse.json(company);
}

export async function PUT(request: Request) {
  const auth = await requireUser("agent");
  if (auth.error) return auth.error;
  const existing = await getCompany(auth.user.companyId);
  if (!existing) return NextResponse.json({ error: "No company is linked to this agent." }, { status: 404 });
  const body = (await request.json()) as Company;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  }
  const saved = await saveCompany({ ...existing, ...body, id: existing.id, name: body.name.trim() });
  revalidatePath("/", "layout");
  return NextResponse.json(saved);
}
