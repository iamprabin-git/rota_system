import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { hashPassword, requireUser } from "@/lib/auth";
import { withCompanyDefaults } from "@/lib/company";
import { getUserByEmail, listCompanies, upsertCompany, upsertUser } from "@/lib/db";
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
  const body = (await request.json()) as Partial<Company> & {
    agentName?: string;
    agentEmail?: string;
    agentPassword?: string;
  };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  }
  const agentName = body.agentName?.trim() || "";
  const agentEmail = body.agentEmail?.trim().toLowerCase() || "";
  const agentPassword = body.agentPassword || "";
  if (!agentName || !agentEmail || !agentPassword) {
    return NextResponse.json({ error: "Add the first agent name, login and password." }, { status: 400 });
  }
  if (await getUserByEmail(agentEmail)) {
    return NextResponse.json({ error: "That agent login is already in use." }, { status: 409 });
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
      crmStage: "active",
      crmNotes: "",
      nextFollowUp: "",
      lastContactedAt: "",
    }),
  );
  const agent = await upsertUser({
    id: `user_${crypto.randomUUID()}`,
    email: agentEmail,
    passwordHash: hashPassword(agentPassword),
    name: agentName,
    role: "agent",
    companyId: company.id,
    employeeId: null,
    createdAt: new Date().toISOString(),
    status: "active",
  });
  revalidatePath("/", "layout");
  return NextResponse.json(
    { ...company, agent: { id: agent.id, email: agent.email, name: agent.name } },
    { status: 201 },
  );
}
