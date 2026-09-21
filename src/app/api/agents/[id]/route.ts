import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { hashPassword, requireUser } from "@/lib/auth";
import { deleteUser, getUser, getUserByEmail, upsertUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const user = await getUser(id);
  if (!user || user.role !== "agent") {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }
  const body = (await request.json()) as { email?: string; password?: string; name?: string };
  if (body.email) {
    const email = body.email.trim().toLowerCase();
    const taken = await getUserByEmail(email);
    if (taken && taken.id !== user.id) {
      return NextResponse.json({ error: "That login is already in use." }, { status: 409 });
    }
    user.email = email;
  }
  if (body.name?.trim()) user.name = body.name.trim();
  if (body.password) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    user.passwordHash = hashPassword(body.password);
    user.status = "active";
  }
  const saved = await upsertUser(user);
  revalidatePath("/", "layout");
  return NextResponse.json({ id: saved.id, email: saved.email, name: saved.name, role: saved.role, companyId: saved.companyId });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser("admin");
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const user = await getUser(id);
  if (!user || user.role !== "agent") {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }
  await deleteUser(id);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
