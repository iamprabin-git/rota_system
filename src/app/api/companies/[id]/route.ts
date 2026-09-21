import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { companyAccess, companyCrmStage, companyLiveValue, hasDueCompanyPayment, withCompanyDefaults } from "@/lib/company";
import { deleteCompany, getCompany, listCompanyPayments, upsertCompany } from "@/lib/db";
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
  const current = withCompanyDefaults(existing);
  const access = body.access ? companyAccess({ access: body.access }) : current.access;
  let live = body.live ? companyLiveValue({ live: body.live }) : current.live;
  if (access === "disallowed") live = "deactive";
  if (body.live === "active") {
    if (access === "disallowed") {
      return NextResponse.json({ error: "Allow the company before activating it." }, { status: 400 });
    }
    if (hasDueCompanyPayment(await listCompanyPayments(id))) {
      return NextResponse.json(
        { error: "This company has outstanding payment. Mark invoices received before activating." },
        { status: 400 },
      );
    }
    live = "active";
  }
  const saved = await upsertCompany({
    ...current,
    ...body,
    id,
    name: (body.name ?? existing.name).trim(),
    logo: body.logo === undefined ? existing.logo : body.logo,
    access,
    live,
    crmStage: body.crmStage ? companyCrmStage({ crmStage: body.crmStage }) : current.crmStage,
    crmNotes: body.crmNotes === undefined ? current.crmNotes : body.crmNotes,
    nextFollowUp: body.nextFollowUp === undefined ? current.nextFollowUp : body.nextFollowUp,
    lastContactedAt: body.lastContactedAt === undefined ? current.lastContactedAt : body.lastContactedAt,
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
