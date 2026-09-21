import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteUser, getUser } from "@/lib/db";

export const dynamic = "force-dynamic";

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
