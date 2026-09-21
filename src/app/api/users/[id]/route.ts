import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { scopedCompanyId } from "@/lib/access";
import { hashPassword, requireUser, toSessionUser } from "@/lib/auth";
import { accountStatus } from "@/lib/approvals";
import { deleteUser, getEmployee, getUser, getUserByEmail, listUsers, upsertUser } from "@/lib/db";
import type { AccountStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function publicUser(user: Awaited<ReturnType<typeof getUser>>) {
  if (!user) return user;
  return { ...toSessionUser(user), status: accountStatus(user), phone: user.phone || "", jobTitle: user.jobTitle || "" };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser("agent");
  if (auth.error) return auth.error;
  const companyId = scopedCompanyId(auth.user);
  const { id } = await context.params;
  const user = await getUser(id);
  if (!user || user.role !== "user" || user.companyId !== companyId) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  return NextResponse.json(publicUser(user));
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser("agent");
  if (auth.error) return auth.error;
  const companyId = scopedCompanyId(auth.user);
  const { id } = await context.params;
  const existing = await getUser(id);
  if (!existing || existing.role !== "user" || existing.companyId !== companyId) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    employeeId?: string | null;
    phone?: string;
    jobTitle?: string;
    status?: AccountStatus;
    notifyEmail?: boolean;
  };
  if (body.email) {
    const email = body.email.trim().toLowerCase();
    const taken = await getUserByEmail(email);
    if (taken && taken.id !== existing.id) {
      return NextResponse.json({ error: "That email already has a login." }, { status: 400 });
    }
    existing.email = email;
  }
  if (body.name?.trim()) existing.name = body.name.trim();
  if (body.phone !== undefined) existing.phone = body.phone.trim();
  if (body.jobTitle !== undefined) existing.jobTitle = body.jobTitle.trim();
  if (body.notifyEmail !== undefined) existing.notifyEmail = body.notifyEmail;
  if (body.password) existing.passwordHash = hashPassword(body.password);
  if (body.status) existing.status = accountStatus({ status: body.status });
  if (body.employeeId !== undefined) {
    if (!body.employeeId) {
      existing.employeeId = null;
    } else {
      const employee = await getEmployee(body.employeeId);
      if (!employee || employee.companyId !== companyId) {
        return NextResponse.json({ error: "That person is not in your company." }, { status: 403 });
      }
      const taken = (await listUsers(companyId)).some((user) => user.employeeId === body.employeeId && user.id !== existing.id);
      if (taken) {
        return NextResponse.json({ error: "That person already has a user login." }, { status: 400 });
      }
      existing.employeeId = body.employeeId;
      existing.companyId = employee.companyId;
    }
  }
  const saved = await upsertUser(existing);
  revalidatePath("/", "layout");
  return NextResponse.json(publicUser(saved));
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser("agent");
  if (auth.error) return auth.error;
  const companyId = scopedCompanyId(auth.user);
  const { id } = await context.params;
  const existing = await getUser(id);
  if (!existing || existing.role !== "user" || existing.companyId !== companyId) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  await deleteUser(id);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
