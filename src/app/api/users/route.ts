import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { scopedCompanyId } from "@/lib/access";
import { hashPassword, requireUser, toSessionUser } from "@/lib/auth";
import { getEmployee, getUserByEmail, listEmployees, listUsers, upsertUser } from "@/lib/db";
import type { AccountStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser("agent");
  if (auth.error) return auth.error;
  const companyId = scopedCompanyId(auth.user);
  if (!companyId) return NextResponse.json({ error: "No company is linked to this agent." }, { status: 403 });
  const users = (await listUsers(companyId))
    .filter((user) => user.role === "user")
    .map((user) => ({ ...toSessionUser(user), status: user.status || "active", phone: user.phone || "", jobTitle: user.jobTitle || "", employeeId: user.employeeId }));
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const auth = await requireUser("agent");
  if (auth.error) return auth.error;
  const companyId = scopedCompanyId(auth.user);
  if (!companyId) return NextResponse.json({ error: "No company is linked to this agent." }, { status: 403 });
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    employeeId?: string;
    phone?: string;
    jobTitle?: string;
    approveNow?: boolean;
    status?: AccountStatus;
  };
  const name = body.name?.trim() || "";
  const email = body.email?.trim().toLowerCase() || "";
  const password = body.password || "";
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (await getUserByEmail(email)) {
    return NextResponse.json({ error: "That email already has a login." }, { status: 400 });
  }
  let employeeId: string | null = body.employeeId || null;
  if (employeeId) {
    const employee = await getEmployee(employeeId);
    if (!employee || employee.companyId !== companyId) {
      return NextResponse.json({ error: "That person is not in your company." }, { status: 403 });
    }
    const taken = (await listUsers(companyId)).some((user) => user.employeeId === employeeId);
    if (taken) {
      return NextResponse.json({ error: "That person already has a user login." }, { status: 400 });
    }
  } else {
    const people = await listEmployees(companyId);
    const match = people.find((person) => person.email === email);
    employeeId = match?.id || null;
  }
  const status: AccountStatus = body.approveNow || body.status === "active" ? "active" : "pending";
  const user = await upsertUser({
    id: `user_${crypto.randomUUID()}`,
    email,
    passwordHash: hashPassword(password),
    name,
    role: "user",
    companyId,
    employeeId,
    createdAt: new Date().toISOString(),
    phone: body.phone?.trim() || "",
    jobTitle: body.jobTitle?.trim() || "",
    notifyEmail: true,
    status,
  });
  revalidatePath("/", "layout");
  return NextResponse.json({ ...toSessionUser(user), status: user.status }, { status: 201 });
}
