import { NextResponse } from "next/server";
import { hashPassword, requireUser } from "@/lib/auth";
import { getCompany, getUserByEmail, listAgents, upsertUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId") || undefined;
  return NextResponse.json(listAgents(companyId));
}

export async function POST(request: Request) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const body = (await request.json()) as {
    companyId?: string;
    name?: string;
    email?: string;
    password?: string;
  };
  const company = body.companyId ? getCompany(body.companyId) : undefined;
  if (!company) {
    return NextResponse.json({ error: "Choose a company for this agent." }, { status: 400 });
  }
  const email = body.email?.trim().toLowerCase() || "";
  const name = body.name?.trim() || "";
  const password = body.password || "";
  if (!email || !name || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (getUserByEmail(email)) {
    return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
  }
  const user = upsertUser({
    id: `user_${crypto.randomUUID()}`,
    email,
    passwordHash: hashPassword(password),
    name,
    role: "agent",
    companyId: company.id,
    employeeId: null,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId },
    { status: 201 },
  );
}
