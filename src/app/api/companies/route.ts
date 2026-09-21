import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { withCompanyDefaults } from "@/lib/company";
import { listCompanies, upsertCompany } from "@/lib/db";
import type { Company } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  return NextResponse.json(await listCompanies());
}

export async function POST(request: Request) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const body = (await request.json()) as Partial<Company>;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  }
  const company = await upsertCompany(
    withCompanyDefaults({
      id: `co_${crypto.randomUUID()}`,
      name: body.name.trim(),
      tradingName: body.tradingName?.trim() || body.name.trim(),
      addressLine1: body.addressLine1?.trim() || "",
      addressLine2: body.addressLine2?.trim() || "",
      city: body.city?.trim() || "",
      postcode: (body.postcode || "").trim().toUpperCase(),
      payeReference: body.payeReference?.trim() || "",
      accountsOfficeRef: body.accountsOfficeRef?.trim() || "",
      email: body.email?.trim() || "",
      phone: body.phone?.trim() || "",
      logo: "",
      access: "allowed",
      live: "active",
      crmStage: "lead",
      crmNotes: "",
      nextFollowUp: "",
      lastContactedAt: "",
    }),
  );
  revalidatePath("/", "layout");
  return NextResponse.json(company, { status: 201 });
}
