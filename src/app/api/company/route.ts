import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { withCompanyDefaults } from "@/lib/company";
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
  const current = withCompanyDefaults(existing);
  const saved = await saveCompany({
    ...current,
    ...body,
    id: existing.id,
    name: body.name.trim(),
    logo: body.logo === undefined ? existing.logo : body.logo,
    access: current.access,
    live: current.live,
    crmStage: current.crmStage,
    crmNotes: current.crmNotes,
    nextFollowUp: current.nextFollowUp,
    lastContactedAt: current.lastContactedAt,
  });
  revalidatePath("/", "layout");
  return NextResponse.json(saved);
}
